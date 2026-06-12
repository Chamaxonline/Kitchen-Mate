using KitchenMate.Domain.Enums;

namespace KitchenMate.Application.DTOs;

public record TableDto(Guid Id, string Number, int Capacity, TableStatus Status);

public record CreateTableRequest(string Number, int Capacity);
public record UpdateTableStatusRequest(TableStatus Status);
