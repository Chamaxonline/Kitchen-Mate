using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Infrastructure.Identity;

public class UserService(UserManager<ApplicationUser> userManager) : IUserService
{
    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await userManager.Users.OrderBy(u => u.FullName).ToListAsync(ct);
        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserDto(user.Id, user.Email ?? string.Empty, user.FullName, roles.FirstOrDefault() ?? string.Empty));
        }

        return result;
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        if (!Roles.All.Contains(request.Role))
            throw new BusinessRuleException($"Invalid role. Allowed: {string.Join(", ", Roles.All)}");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new BusinessRuleException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, request.Role);
        return new UserDto(user.Id, user.Email ?? string.Empty, user.FullName, request.Role);
    }
}
