using KitchenMate.Domain.Enums;

namespace KitchenMate.Domain.Entities;

public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public OrderType Type { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Placed;
    public Guid? TableId { get; set; }
    public string? Notes { get; set; }
    public string? CreatedByUserId { get; set; }

    public DiningTable? Table { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    public decimal Total => Items.Sum(i => i.LineTotal);
}
