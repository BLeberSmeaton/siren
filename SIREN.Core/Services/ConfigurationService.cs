using System.Text.Json;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// File-based configuration service that manages team configurations
    /// Supports hot-reloading and dynamic provider registration
    /// </summary>
    public class ConfigurationService : IConfigurationService
    {
        private readonly string _configurationPath;
        private readonly Dictionary<string, TeamConfiguration> _configurationCache;
        private readonly JsonSerializerOptions _jsonOptions;

        public ConfigurationService(string configurationPath = "Data/Config/Teams")
        {
            _configurationPath = configurationPath;
            _configurationCache = new Dictionary<string, TeamConfiguration>();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }

        public async Task<TeamConfiguration?> GetTeamConfigurationAsync(string teamName)
        {
            // Check cache first
            if (_configurationCache.TryGetValue(teamName, out var cachedConfig))
            {
                return cachedConfig;
            }

            // Load from file
            var filePath = Path.Combine(_configurationPath, $"{teamName}.json");
            if (!File.Exists(filePath))
            {
                return null;
            }

            try
            {
                var jsonContent = await File.ReadAllTextAsync(filePath);
                var configuration = JsonSerializer.Deserialize<TeamConfiguration>(jsonContent, _jsonOptions);
                
                if (configuration != null)
                {
                    _configurationCache[teamName] = configuration;
                }

                return configuration;
            }
            catch (Exception)
            {
                // Log error in real implementation
                return null;
            }
        }

        public async Task<IEnumerable<TeamConfiguration>> GetAllTeamConfigurationsAsync()
        {
            var configurations = new List<TeamConfiguration>();

            if (!Directory.Exists(_configurationPath))
            {
                return configurations;
            }

            var configFiles = Directory.GetFiles(_configurationPath, "*.json");
            
            foreach (var file in configFiles)
            {
                var teamName = Path.GetFileNameWithoutExtension(file);
                var config = await GetTeamConfigurationAsync(teamName);
                
                if (config != null)
                {
                    configurations.Add(config);
                }
            }

            return configurations;
        }

        public async Task<IEnumerable<DataSourceConfiguration>> GetEnabledDataSourcesAsync(string teamName)
        {
            var config = await GetTeamConfigurationAsync(teamName);
            return config?.DataSources.Where(ds => ds.IsEnabled) ?? Enumerable.Empty<DataSourceConfiguration>();
        }

        public async Task<IEnumerable<CategoryConfiguration>> GetActiveCategoriesAsync(string teamName)
        {
            var config = await GetTeamConfigurationAsync(teamName);
            return config?.Categories.Where(c => c.IsActive) ?? Enumerable.Empty<CategoryConfiguration>();
        }

        public async Task SaveTeamConfigurationAsync(TeamConfiguration configuration)
        {
            var filePath = Path.Combine(_configurationPath, $"{configuration.TeamName}.json");
            
            // Ensure directory exists
            Directory.CreateDirectory(_configurationPath);

            configuration.UpdatedAt = DateTime.UtcNow;

            var jsonContent = JsonSerializer.Serialize(configuration, _jsonOptions);
            await File.WriteAllTextAsync(filePath, jsonContent);

            // Update cache
            _configurationCache[configuration.TeamName] = configuration;
        }

        public async Task<Dictionary<string, string>> GetProviderSettingsAsync(string teamName, string sourceType)
        {
            var dataSources = await GetEnabledDataSourcesAsync(teamName);
            var source = dataSources.FirstOrDefault(ds => 
                ds.SourceType.Equals(sourceType, StringComparison.OrdinalIgnoreCase));

            return source?.Settings ?? new Dictionary<string, string>();
        }
    }
}
