namespace KitchenMate.Domain.Enums;

public enum OrderStatus
{
    Placed = 0,
    SentToKitchen = 1,
    InKitchen = 2,
    Ready = 3,
    Completed = 4,
    Cancelled = 5
}
