using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("reservations")]
public class Reservation
{
  [Column("id")]
  public int Id { get; set; }
  [Column("client_id")]
  public int ClientId { get; set; }
  [Column("table_id")]
  public int TableId { get; set; }
  [Column("reservation_time")]
  public DateTime ReservationTime { get; set; }
  [Column("duration_hours")]
  public int DurationHours { get; set; } = 2;
  [Column("guests_count")]
  public int GuestsCount { get; set; }
  [Column("special_requests")]
  public string? SpecialRequests { get; set; }
}