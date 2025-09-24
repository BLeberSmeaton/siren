using Microsoft.Extensions.Diagnostics.HealthChecks;
using SIREN.Core.Interfaces;

namespace SIREN.API.HealthChecks
{
    /// <summary>
    /// Health check that validates all critical services can be resolved from DI container.
    /// This prevents runtime failures due to missing service registrations.
    /// </summary>
    public class DependencyValidationHealthCheck : IHealthCheck
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DependencyValidationHealthCheck> _logger;

        public DependencyValidationHealthCheck(
            IServiceProvider serviceProvider,
            ILogger<DependencyValidationHealthCheck> logger)
        {
            _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var criticalServices = new Dictionary<string, Type>
                {
                    ["SignalOrchestrator"] = typeof(ISignalOrchestrator),
                    ["SignalProvider"] = typeof(ISignalProvider),
                    ["Categorizer"] = typeof(ICategorizer),
                    ["ManualTriageService"] = typeof(IManualTriageService),
                    ["ConfigurationService"] = typeof(IConfigurationService)
                };

                var missingServices = new List<string>();
                var resolvedServices = new List<string>();

                foreach (var (serviceName, serviceType) in criticalServices)
                {
                    try
                    {
                        var service = _serviceProvider.GetService(serviceType);
                        if (service == null)
                        {
                            missingServices.Add($"{serviceName} ({serviceType.Name})");
                        }
                        else
                        {
                            resolvedServices.Add(serviceName);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to resolve service {ServiceName} ({ServiceType})", serviceName, serviceType.Name);
                        missingServices.Add($"{serviceName} ({serviceType.Name}) - {ex.Message}");
                    }
                }

                if (missingServices.Any())
                {
                    var message = $"Missing or unresolvable services: {string.Join(", ", missingServices)}";
                    _logger.LogError("Dependency validation failed: {Message}", message);
                    
                    return Task.FromResult(HealthCheckResult.Unhealthy(
                        message,
                        data: new Dictionary<string, object>
                        {
                            ["missing_services"] = missingServices,
                            ["resolved_services"] = resolvedServices,
                            ["total_checked"] = criticalServices.Count
                        }));
                }

                _logger.LogInformation("All critical services resolved successfully: {Services}", 
                    string.Join(", ", resolvedServices));

                return Task.FromResult(HealthCheckResult.Healthy(
                    $"All {resolvedServices.Count} critical services are properly registered",
                    data: new Dictionary<string, object>
                    {
                        ["resolved_services"] = resolvedServices,
                        ["total_checked"] = criticalServices.Count
                    }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dependency validation health check failed");
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    $"Health check execution failed: {ex.Message}",
                    ex));
            }
        }
    }
}
