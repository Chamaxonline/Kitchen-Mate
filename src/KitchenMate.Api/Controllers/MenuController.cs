using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuController(MenuService menuService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryDto>>> GetMenu(CancellationToken ct)
        => Ok(await menuService.GetMenuAsync(ct));

    [HttpPost("categories")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<MenuCategorySummaryDto>> CreateCategory([FromBody] CreateMenuCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var category = await menuService.CreateCategoryAsync(request, ct);
            return CreatedAtAction(nameof(GetMenu), new { }, category);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("categories/{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<ActionResult<MenuCategorySummaryDto>> UpdateCategory(Guid id, [FromBody] UpdateMenuCategoryRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await menuService.UpdateCategoryAsync(id, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("categories/{id:guid}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct)
    {
        try
        {
            await menuService.DeleteCategoryAsync(id, ct);
            return NoContent();
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("items")]
    [Authorize(Policy = "ManagerOrAdmin")]
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
    [Authorize(Policy = "ManagerOrAdmin")]
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
