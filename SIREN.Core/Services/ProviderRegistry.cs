using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Registry for managing and instantiating signal providers based on team configuration
    /// Enables dynamic provider loading and extensibility
    /// </summary>
    public class ProviderRegistry
    {
        private readonly Dictionary<string, Func<DataSourceConfiguration, ISignalProvider>> _providerFactories;
        private readonly IConfigurationService _configurationService;

        public ProviderRegistry(IConfigurationService configurationService)
        {
            _configurationService = configurationService;
            _providerFactories = new Dictionary<string, Func<DataSourceConfiguration, ISignalProvider>>(
                StringComparer.OrdinalIgnoreCase);

            RegisterDefaultProviders();
        }

        /// <summary>
        /// Register a provider factory for a specific source type
        /// </summary>
        public void RegisterProvider<T>(string sourceType, Func<DataSourceConfiguration, T> factory) 
            where T : ISignalProvider
        {
            _providerFactories[sourceType] = config => factory(config);
        }

        /// <summary>
        /// Get all enabled providers for a specific team
        /// </summary>
        public async Task<IEnumerable<ISignalProvider>> GetProvidersForTeamAsync(string teamName)
        {
            var providers = new List<ISignalProvider>();
            var dataSources = await _configurationService.GetEnabledDataSourcesAsync(teamName);

            foreach (var dataSource in dataSources)
            {
                var provider = CreateProvider(dataSource);
                if (provider != null)
                {
                    providers.Add(provider);
                }
            }

            return providers;
        }

        /// <summary>
        /// Create a provider instance from configuration
        /// </summary>
        public ISignalProvider? CreateProvider(DataSourceConfiguration config)
        {
            if (_providerFactories.TryGetValue(config.SourceType, out var factory))
            {
                try
                {
                    return factory(config);
                }
                catch (Exception)
                {
                    // Log error in real implementation
                    return null;
                }
            }

            return null;
        }

        /// <summary>
        /// Get all registered source types
        /// </summary>
        public IEnumerable<string> GetAvailableSourceTypes()
        {
            return _providerFactories.Keys;
        }

        private void RegisterDefaultProviders()
        {
            // Register CSV provider
            RegisterProvider("CSV", config => new Providers.CsvSignalProvider(
                GetCsvContentFromConfig(config)));

            // Register mock providers for testing extensibility
            RegisterProvider("Teams", config => new MockTeamsProvider(config));
            RegisterProvider("Slack", config => new MockSlackProvider(config));
            RegisterProvider("Jira", config => new MockJiraProvider(config));
        }

        private string GetCsvContentFromConfig(DataSourceConfiguration config)
        {
            if (config.Settings.TryGetValue("filePath", out var filePath))
            {
                try
                {
                    return File.ReadAllText(filePath);
                }
                catch
                {
                    return string.Empty;
                }
            }

            return string.Empty;
        }
    }

    #region Mock Providers for Testing Extensibility

    /// <summary>
    /// Mock Teams provider for testing the extensibility pattern
    /// </summary>
    public class MockTeamsProvider : ISignalProvider
    {
        private readonly DataSourceConfiguration _config;

        public string ProviderName => $"Teams ({_config.Name})";

        public MockTeamsProvider(DataSourceConfiguration config)
        {
            _config = config;
        }

        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(100); // Simulate API call

            // Simulate Teams messages
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "teams-001",
                    Title = "Service seems slow in production",
                    Description = "Users reporting latency issues with the API endpoints",
                    Source = ProviderName,
                    Timestamp = DateTime.UtcNow.AddMinutes(-30)
                },
                new SupportSignal
                {
                    Id = "teams-002", 
                    Title = "Certificate expiry warning",
                    Description = "SSL certificate expires in 7 days - keyvault renewal needed",
                    Source = ProviderName,
                    Timestamp = DateTime.UtcNow.AddMinutes(-10)
                }
            };

            return signals;
        }
    }

    /// <summary>
    /// Mock Slack provider for testing the extensibility pattern
    /// </summary>
    public class MockSlackProvider : ISignalProvider
    {
        private readonly DataSourceConfiguration _config;

        public string ProviderName => $"Slack ({_config.Name})";

        public MockSlackProvider(DataSourceConfiguration config)
        {
            _config = config;
        }

        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(150); // Simulate API call

            // Simulate Slack messages  
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "slack-001",
                    Title = "Database connection issues",
                    Description = "Connection pool exhausted, queries timing out",
                    Source = ProviderName,
                    Timestamp = DateTime.UtcNow.AddMinutes(-45)
                }
            };

            return signals;
        }
    }

    /// <summary>
    /// Mock Jira provider for testing the extensibility pattern  
    /// </summary>
    public class MockJiraProvider : ISignalProvider
    {
        private readonly DataSourceConfiguration _config;

        public string ProviderName => $"Jira ({_config.Name})";

        public MockJiraProvider(DataSourceConfiguration config)
        {
            _config = config;
        }

        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(200); // Simulate API call

            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "JIRA-123",
                    Title = "High Priority: Security vulnerability detected",
                    Description = "Wiz scanner found SQL injection vulnerability in user input validation",
                    Source = ProviderName,
                    Timestamp = DateTime.UtcNow.AddHours(-2)
                }
            };

            return signals;
        }
    }

    #endregion
}
