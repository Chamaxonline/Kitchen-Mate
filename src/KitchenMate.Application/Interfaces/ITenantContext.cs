namespace KitchenMate.Application.Interfaces;

public interface ITenantContext
{
    Guid? TenantId { get; }
    bool HasTenant { get; }
}
