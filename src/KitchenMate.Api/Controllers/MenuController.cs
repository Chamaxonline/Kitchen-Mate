using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController(MenuService menuService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryDto>>> GetMenu(CancellationToken ct)
        => Ok(await menuService.GetMenuAsync(ct));

    [HttpPost("items")]
    public async Task<ActionResult<MenuItemDto>> CreateItem([FromBody] CreateMenuItemRequest request, CancellationToken ct)
    {
        try
        {
            var item = await menuService.CreateItemAsync(request, ct);
            return CreatedAtAction(nameof(GetMenu), new { }, item);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<MenuItemDto>> UpdateItem(Guid id, [FromBody] UpdateMenuItemRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await menuService.UpdateItemAsync(id, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
