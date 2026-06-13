using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KitchenMate.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddCookTimeMinutes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "CookTimeMinutes",
            table: "OrderItems",
            type: "int",
            nullable: false,
            defaultValue: 10);

        migrationBuilder.AddColumn<int>(
            name: "CookTimeMinutes",
            table: "MenuItems",
            type: "int",
            nullable: false,
            defaultValue: 10);

        migrationBuilder.Sql("""
            UPDATE mi SET mi.CookTimeMinutes = CASE mi.Name
                WHEN 'Spring Rolls' THEN 8
                WHEN 'Soup of the Day' THEN 12
                WHEN 'Garlic Bread' THEN 6
                WHEN 'Caesar Salad' THEN 5
                WHEN 'Grilled Chicken' THEN 18
                WHEN 'Beef Burger' THEN 15
                WHEN 'Vegetable Pasta' THEN 14
                WHEN 'Fish & Chips' THEN 16
                WHEN 'Chocolate Cake' THEN 5
                WHEN 'Ice Cream Scoop' THEN 2
                WHEN 'Soft Drink' THEN 1
                WHEN 'Fresh Juice' THEN 3
                WHEN 'Coffee' THEN 4
                WHEN 'Iced Tea' THEN 2
                ELSE 10
            END
            FROM MenuItems mi;

            UPDATE oi SET oi.CookTimeMinutes = mi.CookTimeMinutes
            FROM OrderItems oi
            INNER JOIN MenuItems mi ON oi.MenuItemId = mi.Id;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CookTimeMinutes",
            table: "OrderItems");

        migrationBuilder.DropColumn(
            name: "CookTimeMinutes",
            table: "MenuItems");
    }
}
