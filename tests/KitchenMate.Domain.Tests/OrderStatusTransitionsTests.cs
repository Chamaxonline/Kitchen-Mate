using KitchenMate.Domain;
using KitchenMate.Domain.Enums;
using Xunit;

namespace KitchenMate.Domain.Tests;

public class OrderStatusTransitionsTests
{
    [Theory]
    [InlineData(OrderStatus.Placed, OrderStatus.SentToKitchen, true)]
    [InlineData(OrderStatus.SentToKitchen, OrderStatus.InKitchen, true)]
    [InlineData(OrderStatus.InKitchen, OrderStatus.Ready, true)]
    [InlineData(OrderStatus.Ready, OrderStatus.Completed, true)]
    [InlineData(OrderStatus.Placed, OrderStatus.Ready, false)]
    [InlineData(OrderStatus.Completed, OrderStatus.Cancelled, false)]
    public void CanTransition_ReturnsExpected(OrderStatus from, OrderStatus to, bool expected)
    {
        Assert.Equal(expected, OrderStatusTransitions.CanTransition(from, to));
    }
}
