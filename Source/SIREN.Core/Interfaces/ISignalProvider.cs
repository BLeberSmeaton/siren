using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Interface for pluggable signal providers (CSV, Jira API, Teams API, etc.)
    /// This enables the extensible architecture where we can add new data sources
    /// without changing existing code.
    /// </summary>
    public interface ISignalProvider
    {
        /// <summary>
        /// Retrieves support signals from the provider's data source
        /// </summary>
        /// <returns>Collection of support signals</returns>
        Task<IEnumerable<SupportSignal>> GetSignalsAsync();

        /// <summary>
        /// Human-readable name of this provider for logging/debugging
        /// </summary>
        string ProviderName { get; }
    }
}
