using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SIREN.API.HealthChecks
{
    /// <summary>
    /// Health check that validates all critical file system dependencies exist and are accessible.
    /// This prevents runtime failures due to missing or inaccessible files.
    /// </summary>
    public class FileSystemHealthCheck : IHealthCheck
    {
        private readonly ILogger<FileSystemHealthCheck> _logger;

        public FileSystemHealthCheck(ILogger<FileSystemHealthCheck> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var criticalPaths = new Dictionary<string, (string Path, bool IsDirectory)>
                {
                    ["CSV Data File"] = (Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Processed", "Jira_ARLive_categorized.csv"), false),
                    ["Teams Config Directory"] = (Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Config", "Teams"), true),
                    ["Manual Triage Data Directory"] = (Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data"), true),
                    ["Issue Type Config"] = (Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "Config", "IssueType.csv"), false)
                };

                var missingPaths = new List<string>();
                var accessiblePaths = new List<string>();
                var warnings = new List<string>();

                foreach (var (name, (path, isDirectory)) in criticalPaths)
                {
                    try
                    {
                        if (isDirectory)
                        {
                            if (Directory.Exists(path))
                            {
                                // Test directory access
                                var files = Directory.EnumerateFiles(path).Take(1).ToList();
                                accessiblePaths.Add($"{name} ({Directory.EnumerateFiles(path).Count()} files)");
                            }
                            else
                            {
                                missingPaths.Add($"{name} - Directory not found: {path}");
                            }
                        }
                        else
                        {
                            if (File.Exists(path))
                            {
                                // Test file readability
                                var fileInfo = new FileInfo(path);
                                var sizeKb = fileInfo.Length / 1024;
                                
                                using var stream = File.OpenRead(path);
                                stream.ReadByte(); // Test read access
                                
                                accessiblePaths.Add($"{name} ({sizeKb:N0} KB)");
                                
                                // Warn if file is empty
                                if (fileInfo.Length == 0)
                                {
                                    warnings.Add($"{name} is empty");
                                }
                            }
                            else
                            {
                                missingPaths.Add($"{name} - File not found: {path}");
                            }
                        }
                    }
                    catch (UnauthorizedAccessException ex)
                    {
                        missingPaths.Add($"{name} - Access denied: {ex.Message}");
                    }
                    catch (IOException ex)
                    {
                        missingPaths.Add($"{name} - IO error: {ex.Message}");
                    }
                    catch (Exception ex)
                    {
                        missingPaths.Add($"{name} - Error: {ex.Message}");
                    }
                }

                // Check write permissions for manual triage file
                try
                {
                    var manualTriageFile = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Data", "manual_triage.json");
                    var testFile = Path.Combine(Path.GetDirectoryName(manualTriageFile)!, ".healthcheck_temp");
                    
                    File.WriteAllText(testFile, "test");
                    File.Delete(testFile);
                    
                    accessiblePaths.Add("Write permissions - OK");
                }
                catch (Exception ex)
                {
                    warnings.Add($"Write permission test failed: {ex.Message}");
                }

                if (missingPaths.Any())
                {
                    var message = $"Critical file system resources unavailable: {string.Join(", ", missingPaths)}";
                    _logger.LogError("File system health check failed: {Message}", message);
                    
                    return Task.FromResult(HealthCheckResult.Unhealthy(
                        message,
                        data: new Dictionary<string, object>
                        {
                            ["missing_paths"] = missingPaths,
                            ["accessible_paths"] = accessiblePaths,
                            ["warnings"] = warnings,
                            ["total_checked"] = criticalPaths.Count
                        }));
                }

                var status = warnings.Any() ? HealthStatus.Degraded : HealthStatus.Healthy;
                var description = warnings.Any() 
                    ? $"All critical paths accessible but {warnings.Count} warning(s)"
                    : $"All {accessiblePaths.Count} critical file system resources are accessible";

                if (warnings.Any())
                {
                    _logger.LogWarning("File system health check has warnings: {Warnings}", string.Join(", ", warnings));
                }
                else
                {
                    _logger.LogInformation("All file system resources accessible: {Paths}", string.Join(", ", accessiblePaths));
                }

                return Task.FromResult(new HealthCheckResult(
                    status,
                    description,
                    data: new Dictionary<string, object>
                    {
                        ["accessible_paths"] = accessiblePaths,
                        ["warnings"] = warnings,
                        ["total_checked"] = criticalPaths.Count
                    }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "File system health check execution failed");
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    $"File system health check execution failed: {ex.Message}",
                    ex));
            }
        }
    }
}
