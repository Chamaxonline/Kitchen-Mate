using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TablesController(TableService tableService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TableDto>>> GetAll(CancellationToken ct)
        => Ok(await tableService.GetAllAsync(ct));

    [HttpPost]
    public async Task<ActionResult<TableDto>> Create([FromBody] CreateTableRequest request, CancellationToken ct)
    {
        try
        {
            var table = await tableService.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetAll), new { }, table);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TableDto>> UpdateStatus(Guid id, [FromBody] UpdateTableStatusRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await tableService.UpdateStatusAsync(id, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
