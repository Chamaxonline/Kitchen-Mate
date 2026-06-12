using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KitchenMate.Infrastructure.Migrations;

/// <inheritdoc />
public partial class AddMultiTenancy : Migration
{
    private static readonly Guid DemoTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Tables_Number",
            table: "Tables");

        migrationBuilder.DropIndex(
            name: "IX_Orders_OrderNumber",
            table: "Orders");

        migrationBuilder.CreateTable(
            name: "Tenants",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Slug = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Tenants", x => x.Id);
            });

        migrationBuilder.InsertData(
            table: "Tenants",
            columns: new[] { "Id", "Name", "Slug", "IsActive", "CreatedAt" },
            values: new object[] { DemoTenantId, "Demo Restaurant", "demo", true, DateTime.UtcNow });

        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "Tables",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "Orders",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "MenuItems",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "MenuCategories",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "TenantId",
            table: "AspNetUsers",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.Sql($"""
            UPDATE [Tables] SET [TenantId] = '{DemoTenantId}' WHERE [TenantId] IS NULL;
            UPDATE [Orders] SET [TenantId] = '{DemoTenantId}' WHERE [TenantId] IS NULL;
            UPDATE [MenuItems] SET [TenantId] = '{DemoTenantId}' WHERE [TenantId] IS NULL;
            UPDATE [MenuCategories] SET [TenantId] = '{DemoTenantId}' WHERE [TenantId] IS NULL;
            UPDATE [AspNetUsers] SET [TenantId] = '{DemoTenantId}' WHERE [TenantId] IS NULL;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "TenantId",
            table: "Tables",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.AlterColumn<Guid>(
            name: "TenantId",
            table: "Orders",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.AlterColumn<Guid>(
            name: "TenantId",
            table: "MenuItems",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.AlterColumn<Guid>(
            name: "TenantId",
            table: "MenuCategories",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.AlterColumn<Guid>(
            name: "TenantId",
            table: "AspNetUsers",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Tables_TenantId_Number",
            table: "Tables",
            columns: new[] { "TenantId", "Number" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Orders_TenantId_OrderNumber",
            table: "Orders",
            columns: new[] { "TenantId", "OrderNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_MenuItems_TenantId",
            table: "MenuItems",
            column: "TenantId");

        migrationBuilder.CreateIndex(
            name: "IX_MenuCategories_TenantId",
            table: "MenuCategories",
            column: "TenantId");

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUsers_TenantId",
            table: "AspNetUsers",
            column: "TenantId");

        migrationBuilder.CreateIndex(
            name: "IX_Tenants_Slug",
            table: "Tenants",
            column: "Slug",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_AspNetUsers_Tenants_TenantId",
            table: "AspNetUsers",
            column: "TenantId",
            principalTable: "Tenants",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_MenuCategories_Tenants_TenantId",
            table: "MenuCategories",
            column: "TenantId",
            principalTable: "Tenants",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_MenuItems_Tenants_TenantId",
            table: "MenuItems",
            column: "TenantId",
            principalTable: "Tenants",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_Orders_Tenants_TenantId",
            table: "Orders",
            column: "TenantId",
            principalTable: "Tenants",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_Tables_Tenants_TenantId",
            table: "Tables",
            column: "TenantId",
            principalTable: "Tenants",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_AspNetUsers_Tenants_TenantId",
            table: "AspNetUsers");

        migrationBuilder.DropForeignKey(
            name: "FK_MenuCategories_Tenants_TenantId",
            table: "MenuCategories");

        migrationBuilder.DropForeignKey(
            name: "FK_MenuItems_Tenants_TenantId",
            table: "MenuItems");

        migrationBuilder.DropForeignKey(
            name: "FK_Orders_Tenants_TenantId",
            table: "Orders");

        migrationBuilder.DropForeignKey(
            name: "FK_Tables_Tenants_TenantId",
            table: "Tables");

        migrationBuilder.DropTable(
            name: "Tenants");

        migrationBuilder.DropIndex(
            name: "IX_Tables_TenantId_Number",
            table: "Tables");

        migrationBuilder.DropIndex(
            name: "IX_Orders_TenantId_OrderNumber",
            table: "Orders");

        migrationBuilder.DropIndex(
            name: "IX_MenuItems_TenantId",
            table: "MenuItems");

        migrationBuilder.DropIndex(
            name: "IX_MenuCategories_TenantId",
            table: "MenuCategories");

        migrationBuilder.DropIndex(
            name: "IX_AspNetUsers_TenantId",
            table: "AspNetUsers");

        migrationBuilder.DropColumn(
            name: "TenantId",
            table: "Tables");

        migrationBuilder.DropColumn(
            name: "TenantId",
            table: "Orders");

        migrationBuilder.DropColumn(
            name: "TenantId",
            table: "MenuItems");

        migrationBuilder.DropColumn(
            name: "TenantId",
            table: "MenuCategories");

        migrationBuilder.DropColumn(
            name: "TenantId",
            table: "AspNetUsers");

        migrationBuilder.CreateIndex(
            name: "IX_Tables_Number",
            table: "Tables",
            column: "Number",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Orders_OrderNumber",
            table: "Orders",
            column: "OrderNumber",
            unique: true);
    }
}
