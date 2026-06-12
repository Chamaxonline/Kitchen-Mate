using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantsController(ITenantService tenantService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterTenantRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await tenantService.RegisterAsync(request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("current")]
    [Authorize]
    public async Task<ActionResult<TenantDto>> Current(CancellationToken ct)
    {
        var tenant = await tenantService.GetCurrentTenantAsync(ct);
        return tenant is null ? NotFound() : Ok(tenant);
    }
}
