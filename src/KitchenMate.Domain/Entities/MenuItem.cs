namespace KitchenMate.Domain.Entities;

public class MenuItem : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;

    public MenuCategory Category { get; set; } = null!;
}
