using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
  public class AppDbContext : DbContext
  {
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Table> Tables { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Reservation> Reservations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      base.OnModelCreating(modelBuilder);
      modelBuilder.Entity<Table>().ToTable("tables");
      modelBuilder.Entity<Client>().ToTable("clients");
      modelBuilder.Entity<Reservation>().ToTable("reservations");
    }
  }
}