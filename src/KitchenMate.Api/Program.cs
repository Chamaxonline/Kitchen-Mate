using System.Text;
using KitchenMate.Api.Middleware;
using KitchenMate.Application;
using KitchenMate.Domain.Constants;
using KitchenMate.Infrastructure;
using KitchenMate.Infrastructure.Identity;
using KitchenMate.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"] ?? "KitchenMate_Dev_Signing_Key_Change_In_Production_32chars!";
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(Roles.Manager, Roles.Admin));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Admin));
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "KitchenMate",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "KitchenMate",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedData.InitializeAsync(db);
    await IdentitySeedData.InitializeAsync(scope.ServiceProvider);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var waiter = await userManager.FindByEmailAsync("waiter@kitchen.local");
    await SeedData.SeedSampleOrdersAsync(db, waiter?.Id);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
