using KitchenMate.Domain.Enums;

namespace KitchenMate.Domain.Entities;

public class Order : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public string OrderNumber { get; set; } = string.Empty;
    public OrderType Type { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Placed;
    public Guid? TableId { get; set; }
    public string? Notes { get; set; }
    public string? CreatedByUserId { get; set; }
    public bool IsGuestOrder { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public string? StripePaymentIntentId { get; set; }
    public DateTime? PaidAt { get; set; }

    public DiningTable? Table { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public decimal Total => Items.Sum(i => i.LineTotal);
}
