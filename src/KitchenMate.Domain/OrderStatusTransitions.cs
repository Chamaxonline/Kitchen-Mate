using KitchenMate.Domain.Enums;

namespace KitchenMate.Domain;

public static class OrderStatusTransitions
{
    private static readonly Dictionary<OrderStatus, HashSet<OrderStatus>> Allowed = new()
    {
        [OrderStatus.Placed] = [OrderStatus.SentToKitchen, OrderStatus.Cancelled],
        [OrderStatus.SentToKitchen] = [OrderStatus.InKitchen, OrderStatus.Cancelled],
        [OrderStatus.InKitchen] = [OrderStatus.Ready, OrderStatus.Cancelled],
        [OrderStatus.Ready] = [OrderStatus.Completed, OrderStatus.Cancelled],
        [OrderStatus.Completed] = [],
        [OrderStatus.Cancelled] = []
    };

    public static bool CanTransition(OrderStatus from, OrderStatus to) =>
        Allowed.TryGetValue(from, out var targets) && targets.Contains(to);
}
