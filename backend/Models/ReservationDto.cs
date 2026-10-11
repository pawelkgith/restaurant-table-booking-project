public class CreateReservationDto
{
  public int ClientId { get; set; }
  public int TableId { get; set; }
  public DateTime ReservationTime { get; set; }
  public int GuestsCount { get; set; }
  public string SpecialRequests { get; set; } = string.Empty;
} 