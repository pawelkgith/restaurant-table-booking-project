using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("tables")]
public class Table
{
  [Column("id")]
  public int Id { get; set; }
  [Column("table_number")]
  public int TableNumber { get; set; }
  [Column("seats")]
  public int Seats { get; set; }
  [Column("is_active")]
  public bool IsActive { get; set; }
}