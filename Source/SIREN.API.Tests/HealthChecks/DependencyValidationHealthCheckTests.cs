using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Moq;
using SIREN.API.HealthChecks;
using SIREN.Core.Interfaces;
using Xunit;

namespace SIREN.API.Tests.HealthChecks
{
    public class DependencyValidationHealthCheckTests
    {
        private readonly Mock<IServiceProvider> _mockServiceProvider;
        private readonly Mock<ILogger<DependencyValidationHealthCheck>> _mockLogger;
        private readonly DependencyValidationHealthCheck _healthCheck;

        public DependencyValidationHealthCheckTests()
        {
            _mockServiceProvider = new Mock<IServiceProvider>();
            _mockLogger = new Mock<ILogger<DependencyValidationHealthCheck>>();
            _healthCheck = new DependencyValidationHealthCheck(_mockServiceProvider.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldReturnHealthy_WhenAllServicesAreResolvable()
        {
            // Arrange
            var mockSignalOrchestrator = new Mock<ISignalOrchestrator>();
            var mockSignalProvider = new Mock<ISignalProvider>();
            var mockCategorizer = new Mock<ICategorizer>();
            var mockManualTriageService = new Mock<IManualTriageService>();
            var mockConfigurationService = new Mock<IConfigurationService>();

            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Returns(mockSignalOrchestrator.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalProvider)))
                .Returns(mockSignalProvider.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ICategorizer)))
                .Returns(mockCategorizer.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IManualTriageService)))
                .Returns(mockManualTriageService.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IConfigurationService)))
                .Returns(mockConfigurationService.Object);

            // Act
            var result = await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            Assert.Equal(HealthStatus.Healthy, result.Status);
            Assert.Contains("All 5 critical services are properly registered", result.Description);
            
            // Verify data contains resolved services
            Assert.True(result.Data.ContainsKey("resolved_services"));
            Assert.True(result.Data.ContainsKey("total_checked"));
            
            var resolvedServices = result.Data["resolved_services"] as List<string>;
            Assert.NotNull(resolvedServices);
            Assert.Equal(5, resolvedServices.Count);
            Assert.Contains("SignalOrchestrator", resolvedServices);
            Assert.Contains("SignalProvider", resolvedServices);
            Assert.Contains("Categorizer", resolvedServices);
            Assert.Contains("ManualTriageService", resolvedServices);
            Assert.Contains("ConfigurationService", resolvedServices);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldReturnUnhealthy_WhenSomeServicesAreMissing()
        {
            // Arrange - Only resolve some services, leave others null
            var mockSignalOrchestrator = new Mock<ISignalOrchestrator>();
            var mockSignalProvider = new Mock<ISignalProvider>();

            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Returns(mockSignalOrchestrator.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalProvider)))
                .Returns(mockSignalProvider.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ICategorizer)))
                .Returns((ICategorizer?)null);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IManualTriageService)))
                .Returns((IManualTriageService?)null);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IConfigurationService)))
                .Returns((IConfigurationService?)null);

            // Act
            var result = await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            Assert.Equal(HealthStatus.Unhealthy, result.Status);
            Assert.Contains("Missing or unresolvable services", result.Description);
            
            // Verify data contains both missing and resolved services
            Assert.True(result.Data.ContainsKey("missing_services"));
            Assert.True(result.Data.ContainsKey("resolved_services"));
            Assert.True(result.Data.ContainsKey("total_checked"));
            
            var missingServices = result.Data["missing_services"] as List<string>;
            var resolvedServices = result.Data["resolved_services"] as List<string>;
            
            Assert.NotNull(missingServices);
            Assert.NotNull(resolvedServices);
            Assert.Equal(3, missingServices.Count);
            Assert.Equal(2, resolvedServices.Count);
            
            Assert.Contains("SignalOrchestrator", resolvedServices);
            Assert.Contains("SignalProvider", resolvedServices);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldReturnUnhealthy_WhenServiceProviderThrowsException()
        {
            // Arrange
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Throws(new InvalidOperationException("Test exception"));

            // Act
            var result = await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            Assert.Equal(HealthStatus.Unhealthy, result.Status);
            Assert.Contains("Missing or unresolvable services", result.Description);
            Assert.Contains("Test exception", result.Description);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldReturnUnhealthy_WhenServiceResolutionFails()
        {
            // Arrange - This tests the service resolution failure path
            _mockServiceProvider.Setup(sp => sp.GetService(It.IsAny<Type>()))
                .Throws(new Exception("Critical failure"));

            // Act
            var result = await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            Assert.Equal(HealthStatus.Unhealthy, result.Status);
            Assert.Contains("Missing or unresolvable services", result.Description);
            Assert.Contains("Critical failure", result.Description);
            
            // Verify data contains the missing services
            Assert.True(result.Data.ContainsKey("missing_services"));
            var missingServices = result.Data["missing_services"] as List<string>;
            Assert.NotNull(missingServices);
            Assert.Equal(5, missingServices.Count); // All 5 services should fail to resolve
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldLogInformation_WhenAllServicesResolve()
        {
            // Arrange
            var mockSignalOrchestrator = new Mock<ISignalOrchestrator>();
            var mockSignalProvider = new Mock<ISignalProvider>();
            var mockCategorizer = new Mock<ICategorizer>();
            var mockManualTriageService = new Mock<IManualTriageService>();
            var mockConfigurationService = new Mock<IConfigurationService>();

            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Returns(mockSignalOrchestrator.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalProvider)))
                .Returns(mockSignalProvider.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ICategorizer)))
                .Returns(mockCategorizer.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IManualTriageService)))
                .Returns(mockManualTriageService.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IConfigurationService)))
                .Returns(mockConfigurationService.Object);

            // Act
            await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("All critical services resolved successfully")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldLogError_WhenServicesAreMissing()
        {
            // Arrange
            _mockServiceProvider.Setup(sp => sp.GetService(It.IsAny<Type>()))
                .Returns((object?)null);

            // Act
            await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Dependency validation failed")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldLogErrorForSpecificServiceFailures()
        {
            // Arrange
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Throws(new InvalidOperationException("Specific service error"));

            // Act
            await _healthCheck.CheckHealthAsync(new HealthCheckContext());

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed to resolve service SignalOrchestrator")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task CheckHealthAsync_ShouldHandleCancellationToken()
        {
            // Arrange
            var mockSignalOrchestrator = new Mock<ISignalOrchestrator>();
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalOrchestrator)))
                .Returns(mockSignalOrchestrator.Object);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ISignalProvider)))
                .Returns((ISignalProvider?)null);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(ICategorizer)))
                .Returns((ICategorizer?)null);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IManualTriageService)))
                .Returns((IManualTriageService?)null);
            _mockServiceProvider.Setup(sp => sp.GetService(typeof(IConfigurationService)))
                .Returns((IConfigurationService?)null);

            using var cts = new CancellationTokenSource();
            cts.Cancel();

            // Act & Assert - Should not throw exception even with cancelled token
            var result = await _healthCheck.CheckHealthAsync(new HealthCheckContext(), cts.Token);
            
            Assert.Equal(HealthStatus.Unhealthy, result.Status);
        }
    }
}
