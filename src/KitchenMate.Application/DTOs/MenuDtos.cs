namespace KitchenMate.Application.DTOs;

public record MenuCategoryDto(Guid Id, string Name, int SortOrder, IReadOnlyList<MenuItemDto> Items);

public record MenuItemDto(
    Guid Id,
    Guid CategoryId,
    string Name,
    string? Description,
    decimal Price,
    bool IsAvailable);

public record CreateMenuCategoryRequest(string Name, int SortOrder);
public record CreateMenuItemRequest(Guid CategoryId, string Name, string? Description, decimal Price);
public record UpdateMenuItemRequest(string Name, string? Description, decimal Price, bool IsAvailable);
