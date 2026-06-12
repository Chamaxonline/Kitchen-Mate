using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KitchenMate.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace KitchenMate.Infrastructure.Identity;

public class JwtTokenGenerator(IConfiguration configuration)
{
    public (string Token, DateTime ExpiresAt) Generate(ApplicationUser user, string role, Tenant tenant)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = configuration["Jwt:Issuer"] ?? "KitchenMate";
        var audience = configuration["Jwt:Audience"] ?? "KitchenMate";
        var expiryHours = int.TryParse(configuration["Jwt:ExpiryHours"], out var hours) ? hours : 8;

        var expires = DateTime.UtcNow.AddHours(expiryHours);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenant.Id.ToString()),
            new("tenant_slug", tenant.Slug),
            new("tenant_name", tenant.Name)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
