using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KitchenMate.Api.Controllers;

[ApiController]
[Route("api/public/{tenantSlug}")]
[AllowAnonymous]
public class PublicGuestController(IGuestOrderService guestOrderService) : ControllerBase
{
    [HttpGet("tables/{tableNumber}/menu")]
    public async Task<ActionResult<GuestMenuDto>> GetMenu(string tenantSlug, string tableNumber, CancellationToken ct)
    {
        try
        {
            return Ok(await guestOrderService.GetMenuAsync(tenantSlug, tableNumber, ct));
        }
        catch (BusinessRuleException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("tables/{tableNumber}/order")]
    public async Task<ActionResult<GuestOrderDto>> GetOrder(string tenantSlug, string tableNumber, CancellationToken ct)
    {
        try
        {
            var order = await guestOrderService.GetUnpaidOrderAsync(tenantSlug, tableNumber, ct);
            return order is null ? NoContent() : Ok(order);
        }
        catch (BusinessRuleException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("tables/{tableNumber}/order")]
    public async Task<ActionResult<GuestOrderDto>> SyncOrder(
        string tenantSlug,
        string tableNumber,
        [FromBody] SyncGuestOrderRequest request,
        CancellationToken ct)
    {
        try
        {
            return Ok(await guestOrderService.SyncUnpaidOrderAsync(tenantSlug, tableNumber, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tables/{tableNumber}/order/pay")]
    public async Task<ActionResult<GuestPaymentIntentDto>> Pay(string tenantSlug, string tableNumber, CancellationToken ct)
    {
        try
        {
            return Ok(await guestOrderService.CreatePaymentAsync(tenantSlug, tableNumber, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tables/{tableNumber}/order/confirm-payment")]
    public async Task<ActionResult<GuestOrderDto>> ConfirmPayment(
        string tenantSlug,
        string tableNumber,
        [FromBody] ConfirmGuestPaymentRequest request,
        CancellationToken ct)
    {
        try
        {
            return Ok(await guestOrderService.ConfirmPaymentAsync(tenantSlug, tableNumber, request, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("tables/{tableNumber}/order/demo-pay")]
    public async Task<ActionResult<GuestOrderDto>> DemoPay(string tenantSlug, string tableNumber, CancellationToken ct)
    {
        try
        {
            return Ok(await guestOrderService.DemoPayAsync(tenantSlug, tableNumber, ct));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
