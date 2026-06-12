namespace KitchenMate.Domain.Constants;

public static class Roles
{
    public const string Waiter = "Waiter";
    public const string Kitchen = "Kitchen";
    public const string Manager = "Manager";
    public const string Admin = "Admin";

    public static readonly string[] All = [Waiter, Kitchen, Manager, Admin];
}
