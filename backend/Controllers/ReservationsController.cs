using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Models;
using Npgsql;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReservationsController : ControllerBase
{
  private readonly AppDbContext _context;
  private readonly IConfiguration _configuration;

  public ReservationsController(AppDbContext context, IConfiguration configuration)
  {
    _context = context;
    _configuration = configuration;
  }

  [HttpGet("tables")]
  public async Task<ActionResult<IEnumerable<Table>>> GetTables()
  {
    var tables = await _context.Tables.Where(t => t.IsActive).ToListAsync();
    return Ok(tables);
  }

  [HttpPost("create")]
  public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDto dto)
  {
    var connectionString = _configuration.GetConnectionString("DefaultConnection");
    
    using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    using var command = new NpgsqlCommand("SELECT success, message FROM sp_create_reservation(@p_client_id, @p_table_id, @p_reservation_time, @p_guests_count, @p_special_requests, @p_duration_hours);", connection);

    command.Parameters.AddWithValue("p_client_id", dto.ClientId);
    command.Parameters.AddWithValue("p_table_id", dto.TableId);
    command.Parameters.AddWithValue("p_reservation_time", dto.ReservationTime);
    command.Parameters.AddWithValue("p_guests_count", dto.GuestsCount);
    command.Parameters.AddWithValue("p_special_requests", string.IsNullOrEmpty(dto.SpecialRequests) ? (object)DBNull.Value : dto.SpecialRequests);
    command.Parameters.AddWithValue("p_duration_hours", dto.DurationHours);

    using var reader = await command.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
      bool success = reader.GetBoolean(0);
      string message = reader.GetString(1);

      if(!success)
      {
        return BadRequest(new { message });
      }

      return Ok(new { message });
    }

    return StatusCode(500, new { message =" An unexpected error occurred while processing the reservation." });
  }

  [HttpGet("client/{clientId}")]
  public async Task<IActionResult> GetClientReservations(int clientId)
  {
    var reservations = await _context.Reservations
      .Where(r => r.ClientId == clientId)
      .OrderByDescending(r => r.ReservationTime)
      .ToListAsync();

    return Ok(reservations);
  }

  [HttpGet("availability")]
  public async Task<IActionResult> GetTableAvailability(
    [FromQuery] int tableId, 
    [FromQuery] string date, 
    [FromQuery] int durationHours = 2)
  {
    if (!DateTime.TryParse(date, out var parsedDate))
    {
      return BadRequest(new { message = "Invalid date format." });
    }

    var startOfDay = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
    var endOfDay = startOfDay.AddDays(1);
    var nowUtc = DateTime.UtcNow;

    var existingReservations = await _context.Reservations
      .Where(r => r.TableId == tableId && r.ReservationTime >= startOfDay && r.ReservationTime < endOfDay)
      .OrderBy(r => r.ReservationTime)
      .ToListAsync();

    var availableSlots = new List<object>();

    int openingMinute = 12 * 60;
    int closingMinute = 22 * 60;
    int durationMinutes = durationHours * 60;

    for (int currentMin = openingMinute; currentMin <= closingMinute - durationMinutes; currentMin += 30)
    {
      var slotStart = startOfDay.AddMinutes(currentMin);
      var slotEnd = slotStart.AddMinutes(durationMinutes);

      if(slotStart < nowUtc)
        continue;

      bool isConflict = existingReservations.Any(r =>
      {
        int rDuration = r.DurationHours;
        var rEnd = r.ReservationTime.AddHours(rDuration);
        return r.ReservationTime < slotEnd && rEnd > slotStart;
      });

      availableSlots.Add(new
      {
        time = slotStart.ToString("yyyy-MM-ddTHH:mm"),
        formattedTime = $"{slotStart:HH:mm} - {slotEnd:HH:mm}",
        isAvailable = !isConflict
      });
    }

    return Ok(availableSlots);
  }
}