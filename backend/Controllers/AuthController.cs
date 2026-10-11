using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<Client> _passwordHasher = new();

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public class AuthDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthDto dto)
    {
        var existingClient = await _context.Clients.FirstOrDefaultAsync(c => c.Email == dto.Email);
        if (existingClient != null)
            return BadRequest(new { message = "Client with this email already exists." });

        var client = new Client
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone
        };

        client.PasswordHash = _passwordHasher.HashPassword(client, dto.Password);

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(client);
        return Ok(new { message = "Registration successful!", client, token });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthDto dto)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == dto.Email);
        if (client == null)
            return NotFound(new { message = "Client not found." });

        var result = _passwordHasher.VerifyHashedPassword(client, client.PasswordHash, dto.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return BadRequest(new { message = "Invalid password." });
        }

        var token = GenerateJwtToken(client);
        return Ok(new { message = "Login successful!", client, token });
    }

    private string GenerateJwtToken(Client client)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, client.Id.ToString()),
            new Claim(ClaimTypes.Email, client.Email),
            new Claim(ClaimTypes.Name, client.FullName)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(3), // Token ważny 3 godziny
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}