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
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://localhost:4173") // React dev servers
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Register SIREN Core services (same as console app)
builder.Services.AddTransient<ICategorizer, CategoryEngine>();
builder.Services.AddTransient<ISignalOrchestrator, SignalOrchestrator>();

// Register configuration service for team management
var teamsConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Config", "Teams");
builder.Services.AddSingleton<IConfigurationService>(provider => 
    new ConfigurationService(teamsConfigPath));

// Register manual triage service for persistence
builder.Services.AddSingleton<IManualTriageService, ManualTriageService>();

// Register CSV provider with real data from processed CSV file
var csvDataPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Processed", "Jira_ARLive_categorized.csv");
var csvData = File.Exists(csvDataPath) ? File.ReadAllText(csvDataPath) : 
    throw new FileNotFoundException($"CSV data file not found at: {csvDataPath}");

builder.Services.AddSingleton<ISignalProvider>(provider => 
    new CsvSignalProvider(csvData));

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
