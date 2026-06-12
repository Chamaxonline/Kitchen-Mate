using KitchenMate.Domain.Enums;

namespace KitchenMate.Domain.Entities;

public class DiningTable : BaseEntity
{
    public string Number { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Available;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
