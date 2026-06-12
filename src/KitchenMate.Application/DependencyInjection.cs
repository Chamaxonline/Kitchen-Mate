using KitchenMate.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KitchenMate.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<MenuService>();
        services.AddScoped<TableService>();
        services.AddScoped<OrderService>();
        return services;
    }
}
