using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Services;
using KitchenMate.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(OrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrders(
        [FromQuery] OrderStatus? status,
        [FromQuery] OrderType? type,
        [FromQuery] bool kitchenQueue = false,
        CancellationToken ct = default)
        => Ok(await orderService.GetOrdersAsync(status, type, kitchenQueue, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetById(Guid id, CancellationToken ct)
    {
        var order = await orderService.GetByIdAsync(id, ct);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderRequest request, CancellationToken ct)
    {
        try
        {
            var order = await orderService.CreateAsync(request, userId: null, ct);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await orderService.UpdateStatusAsync(id, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
