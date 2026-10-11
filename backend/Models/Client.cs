using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("clients")]
public class Client
{
  [Column("id")]
  public int Id { get; set; }
  [Column("full_name")]
  public string FullName { get; set; } = string.Empty;
  [Column("email")]
  public string Email { get; set; } = string.Empty;
  [Column("phone")]
  public string Phone { get; set; } = string.Empty;
  [Column("password_hash")]
  public string PasswordHash { get; set; } = string.Empty;
}