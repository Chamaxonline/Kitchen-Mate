using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KitchenMate.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixStaffOrdersPaymentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE [Orders] SET [PaymentStatus] = 2, [PaidAt] = [CreatedAt] WHERE [IsGuestOrder] = 0 AND [PaymentStatus] = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
