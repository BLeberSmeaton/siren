using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

namespace SIREN.API.HealthChecks
{
    /// <summary>
    /// Health check that validates critical data files have expected structure and content.
    /// This prevents runtime failures due to corrupted or malformed data files.
    /// </summary>
    public class DataIntegrityHealthCheck : IHealthCheck
    {
        private readonly ILogger<DataIntegrityHealthCheck> _logger;

        public DataIntegrityHealthCheck(ILogger<DataIntegrityHealthCheck> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var validationResults = new List<string>();
                var errors = new List<string>();
                var warnings = new List<string>();

                // Check CSV data file structure
                CheckCsvDataFile(validationResults, errors, warnings);

                // Check team configuration files
                CheckTeamConfigFiles(validationResults, errors, warnings);

                // Check manual triage file if it exists
                CheckManualTriageFile(validationResults, errors, warnings);

                if (errors.Any())
                {
                    var message = $"Data integrity issues found: {string.Join(", ", errors)}";
                    _logger.LogError("Data integrity health check failed: {Message}", message);
                    
                    return Task.FromResult(HealthCheckResult.Unhealthy(
                        message,
                        data: new Dictionary<string, object>
                        {
                            ["errors"] = errors,
                            ["warnings"] = warnings,
                            ["validations_passed"] = validationResults,
                            ["total_validations"] = errors.Count + warnings.Count + validationResults.Count
                        }));
                }

                var status = warnings.Any() ? HealthStatus.Degraded : HealthStatus.Healthy;
                var description = warnings.Any() 
                    ? $"Data integrity mostly good, {warnings.Count} warning(s)"
                    : $"All {validationResults.Count} data integrity checks passed";

                if (warnings.Any())
                {
                    _logger.LogWarning("Data integrity health check has warnings: {Warnings}", string.Join(", ", warnings));
                }
                else
                {
                    _logger.LogInformation("All data integrity checks passed: {Results}", string.Join(", ", validationResults));
                }

                return Task.FromResult(new HealthCheckResult(
                    status,
                    description,
                    data: new Dictionary<string, object>
                    {
                        ["validations_passed"] = validationResults,
                        ["warnings"] = warnings,
                        ["total_validations"] = validationResults.Count + warnings.Count
                    }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Data integrity health check execution failed");
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    $"Data integrity health check execution failed: {ex.Message}",
                    ex));
            }
        }

        private void CheckCsvDataFile(List<string> validationResults, List<string> errors, List<string> warnings)
        {
            try
            {
                var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Processed", "Jira_ARLive_categorized.csv");
                
                if (!File.Exists(csvPath))
                {
                    errors.Add("CSV data file not found");
                    return;
                }

                var lines = File.ReadAllLines(csvPath);
                
                if (lines.Length == 0)
                {
                    errors.Add("CSV data file is empty");
                    return;
                }

                // Check header line
                var header = lines[0];
                var expectedHeaders = new[] { "id", "title", "description", "source", "timestamp", "category" };
                var actualHeaders = header.Split(',').Select(h => h.Trim('"').ToLower()).ToArray();
                
                var missingHeaders = expectedHeaders.Except(actualHeaders).ToList();
                if (missingHeaders.Any())
                {
                    warnings.Add($"CSV missing expected headers: {string.Join(", ", missingHeaders)}");
                }

                // Basic data validation
                var dataLines = lines.Skip(1).ToArray();
                if (dataLines.Length == 0)
                {
                    warnings.Add("CSV has header but no data rows");
                }
                else
                {
                    var invalidRows = 0;
                    var sampleSize = Math.Min(10, dataLines.Length); // Check first 10 rows
                    
                    for (int i = 0; i < sampleSize; i++)
                    {
                        var columns = dataLines[i].Split(',');
                        if (columns.Length < 5) // Minimum expected columns
                        {
                            invalidRows++;
                        }
                    }
                    
                    if (invalidRows > 0)
                    {
                        warnings.Add($"CSV has {invalidRows}/{sampleSize} invalid rows in sample");
                    }
                    else
                    {
                        validationResults.Add($"CSV structure valid ({dataLines.Length} data rows)");
                    }
                }
            }
            catch (Exception ex)
            {
                errors.Add($"CSV validation failed: {ex.Message}");
            }
        }

        private void CheckTeamConfigFiles(List<string> validationResults, List<string> errors, List<string> warnings)
        {
            try
            {
                var teamsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Config", "Teams");
                
                if (!Directory.Exists(teamsPath))
                {
                    errors.Add("Teams configuration directory not found");
                    return;
                }

                var jsonFiles = Directory.GetFiles(teamsPath, "*.json");
                if (jsonFiles.Length == 0)
                {
                    warnings.Add("No team configuration files found");
                    return;
                }

                var validTeams = 0;
                var invalidTeams = new List<string>();

                foreach (var jsonFile in jsonFiles)
                {
                    try
                    {
                        var content = File.ReadAllText(jsonFile);
                        var json = JsonDocument.Parse(content);
                        
                        // Basic validation - check it has some expected properties
                        var root = json.RootElement;
                        if (root.ValueKind == JsonValueKind.Object)
                        {
                            validTeams++;
                        }
                        else
                        {
                            invalidTeams.Add(Path.GetFileName(jsonFile));
                        }
                    }
                    catch (JsonException)
                    {
                        invalidTeams.Add($"{Path.GetFileName(jsonFile)} (invalid JSON)");
                    }
                    catch (Exception ex)
                    {
                        invalidTeams.Add($"{Path.GetFileName(jsonFile)} ({ex.Message})");
                    }
                }

                if (invalidTeams.Any())
                {
                    errors.Add($"Invalid team config files: {string.Join(", ", invalidTeams)}");
                }
                else
                {
                    validationResults.Add($"Team configurations valid ({validTeams} teams)");
                }
            }
            catch (Exception ex)
            {
                errors.Add($"Team config validation failed: {ex.Message}");
            }
        }

        private void CheckManualTriageFile(List<string> validationResults, List<string> errors, List<string> warnings)
        {
            try
            {
                var manualTriagePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "manual_triage.json");
                
                if (!File.Exists(manualTriagePath))
                {
                    // This is OK - file gets created when needed
                    validationResults.Add("Manual triage file not present (will be created when needed)");
                    return;
                }

                var content = File.ReadAllText(manualTriagePath);
                if (string.IsNullOrWhiteSpace(content))
                {
                    validationResults.Add("Manual triage file empty (OK)");
                    return;
                }

                // Validate JSON structure
                var json = JsonDocument.Parse(content);
                var root = json.RootElement;
                
                if (root.ValueKind == JsonValueKind.Object || root.ValueKind == JsonValueKind.Array)
                {
                    validationResults.Add("Manual triage file valid JSON");
                }
                else
                {
                    warnings.Add("Manual triage file has unexpected JSON structure");
                }
            }
            catch (JsonException ex)
            {
                errors.Add($"Manual triage file invalid JSON: {ex.Message}");
            }
            catch (Exception ex)
            {
                warnings.Add($"Manual triage file check failed: {ex.Message}");
            }
        }
    }
}
