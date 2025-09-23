using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Service for managing team configurations and provider settings
    /// Enables multi-team, multi-source extensibility
    /// </summary>
    public interface IConfigurationService
    {
        /// <summary>
        /// Get configuration for a specific team
        /// </summary>
        Task<TeamConfiguration?> GetTeamConfigurationAsync(string teamName);

        /// <summary>
        /// Get all available team configurations
        /// </summary>
        Task<IEnumerable<TeamConfiguration>> GetAllTeamConfigurationsAsync();

        /// <summary>
        /// Get enabled data sources for a specific team
        /// </summary>
        Task<IEnumerable<DataSourceConfiguration>> GetEnabledDataSourcesAsync(string teamName);

        /// <summary>
        /// Get active categories for a team
        /// </summary>
        Task<IEnumerable<CategoryConfiguration>> GetActiveCategoriesAsync(string teamName);

        /// <summary>
        /// Create or update a team configuration
        /// </summary>
        Task SaveTeamConfigurationAsync(TeamConfiguration configuration);

        /// <summary>
        /// Get provider-specific settings for a team and data source
        /// </summary>
        Task<Dictionary<string, string>> GetProviderSettingsAsync(string teamName, string sourceType);
    }
}
