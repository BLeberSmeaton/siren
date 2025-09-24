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

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddCheck<SIREN.API.HealthChecks.DependencyValidationHealthCheck>(
        "dependency-validation",
        tags: new[] { "startup", "dependencies" })
    .AddCheck<SIREN.API.HealthChecks.FileSystemHealthCheck>(
        "file-system",
        tags: new[] { "startup", "filesystem" })
    .AddCheck<SIREN.API.HealthChecks.DataIntegrityHealthCheck>(
        "data-integrity",
        tags: new[] { "startup", "data" });

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

// Map health check endpoints
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds,
                data = entry.Value.Data
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions 
        { 
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true 
        }));
    }
});

// Simple health check endpoint for basic monitoring
app.MapHealthChecks("/health/ready");

// Health check endpoints filtered by tags
app.MapHealthChecks("/health/startup", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("startup"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds,
                tags = entry.Value.Tags
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions 
        { 
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true 
        }));
    }
});

// Live health check endpoint (excludes startup-only checks)
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => !check.Tags.Contains("startup") || check.Tags.Contains("live"),
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(result, new System.Text.Json.JsonSerializerOptions 
        { 
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true 
        }));
    }
});

app.MapControllers();

app.Run();
