using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Application.Services;

public class MenuService(IAppDbContext db)
{
    public async Task<IReadOnlyList<MenuCategoryDto>> GetMenuAsync(CancellationToken ct = default)
    {
        var categories = await db.MenuCategories
            .AsNoTracking()
            .Include(c => c.Items)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        return categories.Select(MapCategory).ToList();
    }

    public async Task<MenuItemDto> CreateItemAsync(CreateMenuItemRequest request, CancellationToken ct = default)
    {
        var categoryExists = await db.MenuCategories.AnyAsync(c => c.Id == request.CategoryId, ct);
        if (!categoryExists)
            throw new BusinessRuleException("Menu category not found.");

        var item = new MenuItem
        {
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price
        };

        db.MenuItems.Add(item);
        await db.SaveChangesAsync(ct);
        return MapItem(item);
    }

    public async Task<MenuItemDto> UpdateItemAsync(Guid id, UpdateMenuItemRequest request, CancellationToken ct = default)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(i => i.Id == id, ct)
            ?? throw new BusinessRuleException("Menu item not found.");

        item.Name = request.Name;
        item.Description = request.Description;
        item.Price = request.Price;
        item.IsAvailable = request.IsAvailable;
        item.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapItem(item);
    }

    private static MenuCategoryDto MapCategory(MenuCategory c) =>
        new(c.Id, c.Name, c.SortOrder, c.Items.OrderBy(i => i.Name).Select(MapItem).ToList());

    private static MenuItemDto MapItem(MenuItem i) =>
        new(i.Id, i.CategoryId, i.Name, i.Description, i.Price, i.IsAvailable);
}
