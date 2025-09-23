using SIREN.Core.Interfaces;
using SIREN.Core.Providers;
using SIREN.Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Add Swagger/OpenAPI documentation services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:4173") // React dev servers
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Register SIREN Core services (same as console app)
builder.Services.AddTransient<ICategorizer, CategoryEngine>();

// Register CSV provider with sample data (we'll make this configurable later)
var sampleCsvData = """
    Summary,Created,Updated,Description,Category
    Certificate expiry notification,22/08/2025 10:21,25/08/2025 14:24,TLS certificate needs renewal in keyvault,
    Bank feed connection issue,18/08/2025 21:29,25/08/2025 11:16,Customer unable to connect bank feeds properly,
    API rate limiting error,14/08/2025 09:57,19/08/2025 13:51,Client API key has exceeded the per-second rate limit,
    Security vulnerability found,14/08/2025 08:41,25/08/2025 14:25,Wiz detected vulnerability in the system,
    User login failures spike,20/08/2025 15:30,26/08/2025 09:15,Multiple users reporting authentication issues,
    Database connection timeout,19/08/2025 11:45,24/08/2025 16:20,Connection pool exhausted during peak hours,
    """;

builder.Services.AddSingleton<ISignalProvider>(provider => 
    new CsvSignalProvider(sampleCsvData));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SIREN API V1");
        c.RoutePrefix = "swagger"; // Makes Swagger available at /swagger
    });
}

app.UseHttpsRedirection();
app.UseCors("ReactApp");

app.MapControllers();

app.Run();
