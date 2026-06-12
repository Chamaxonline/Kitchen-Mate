using KitchenMate.Application.DTOs;
using KitchenMate.Application.Exceptions;
using KitchenMate.Application.Interfaces;
using KitchenMate.Domain.Entities;
using KitchenMate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KitchenMate.Application.Services;

public class TableService(IAppDbContext db)
{
    public async Task<IReadOnlyList<TableDto>> GetAllAsync(CancellationToken ct = default)
    {
        var tables = await db.Tables.AsNoTracking().OrderBy(t => t.Number).ToListAsync(ct);
        return tables.Select(Map).ToList();
    }

    public async Task<TableDto> CreateAsync(CreateTableRequest request, CancellationToken ct = default)
    {
        var exists = await db.Tables.AnyAsync(t => t.Number == request.Number, ct);
        if (exists)
            throw new BusinessRuleException($"Table '{request.Number}' already exists.");

        var table = new DiningTable
        {
            Number = request.Number,
            Capacity = request.Capacity,
            Status = TableStatus.Available
        };

        db.Tables.Add(table);
        await db.SaveChangesAsync(ct);
        return Map(table);
    }

    public async Task<TableDto> UpdateStatusAsync(Guid id, UpdateTableStatusRequest request, CancellationToken ct = default)
    {
        var table = await db.Tables.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new BusinessRuleException("Table not found.");

        table.Status = request.Status;
        table.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(table);
    }

    private static TableDto Map(DiningTable t) => new(t.Id, t.Number, t.Capacity, t.Status);
}
