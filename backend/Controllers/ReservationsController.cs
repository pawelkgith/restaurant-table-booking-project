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

    using var command = new NpgsqlCommand("SELECT success, message FROM sp_create_reservation(@p_client_id, @p_table_id, @p_reservation_time, @p_guests_count, @p_special_requests);", connection);

    command.Parameters.AddWithValue("p_client_id", dto.ClientId);
    command.Parameters.AddWithValue("p_table_id", dto.TableId);
    command.Parameters.AddWithValue("p_reservation_time", dto.ReservationTime);
    command.Parameters.AddWithValue("p_guests_count", dto.GuestsCount);
    command.Parameters.AddWithValue("p_special_requests", string.IsNullOrEmpty(dto.SpecialRequests) ? (object)DBNull.Value : dto.SpecialRequests);

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
}