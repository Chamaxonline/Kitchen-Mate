using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain;
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

    public async Task<MenuCategorySummaryDto> CreateCategoryAsync(CreateMenuCategoryRequest request, CancellationToken ct = default)
    {
        var category = new MenuCategory
        {
            Name = request.Name,
            SortOrder = request.SortOrder
        };

        db.MenuCategories.Add(category);
        await db.SaveChangesAsync(ct);
        return MapCategorySummary(category);
    }

    public async Task<MenuCategorySummaryDto> UpdateCategoryAsync(Guid id, UpdateMenuCategoryRequest request, CancellationToken ct = default)
    {
        var category = await db.MenuCategories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new BusinessRuleException("Menu category not found.");

        category.Name = request.Name;
        category.SortOrder = request.SortOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapCategorySummary(category);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken ct = default)
    {
        var category = await db.MenuCategories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new BusinessRuleException("Menu category not found.");

        if (category.Items.Count > 0)
            throw new BusinessRuleException("Cannot delete a category that still has menu items.");

        db.MenuCategories.Remove(category);
        await db.SaveChangesAsync(ct);
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
            Price = request.Price,
            CookTimeMinutes = NormalizeCookTime(request.CookTimeMinutes)
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
        item.CookTimeMinutes = NormalizeCookTime(request.CookTimeMinutes);
        item.IsAvailable = request.IsAvailable;
        item.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return MapItem(item);
    }

    private static MenuCategoryDto MapCategory(MenuCategory c) =>
        new(c.Id, c.Name, c.SortOrder, c.Items.OrderBy(i => i.Name).Select(MapItem).ToList());

    private static MenuCategorySummaryDto MapCategorySummary(MenuCategory c) =>
        new(c.Id, c.Name, c.SortOrder);

    private static MenuItemDto MapItem(MenuItem i) =>
        new(i.Id, i.CategoryId, i.Name, i.Description, i.Price, i.CookTimeMinutes, i.IsAvailable);

    private static int NormalizeCookTime(int minutes)
    {
        try
        {
            CookTimeRules.Validate(minutes);
            return minutes;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new BusinessRuleException(ex.Message);
        }
    }
}
