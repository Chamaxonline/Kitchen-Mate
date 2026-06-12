using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ManagerOrAdmin")]
public class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll(CancellationToken ct)
        => Ok(await userService.GetAllAsync(ct));

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        try
        {
            var user = await userService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetAll), new { }, user);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
