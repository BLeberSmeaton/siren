using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Orchestrator service that centralizes signal processing logic.
    /// Combines signal retrieval, categorization, and triage application.
    /// Eliminates code duplication across controller endpoints (SRP/DRY principles).
    /// </summary>
    public interface ISignalOrchestrator
    {
        /// <summary>
        /// Get all signals with categorization and triage data applied
        /// </summary>
        /// <returns>Collection of fully processed support signals</returns>
        Task<IEnumerable<SupportSignal>> GetProcessedSignalsAsync();

        /// <summary>
        /// Get a specific signal by ID with categorization applied
        /// </summary>
        /// <param name="signalId">The signal ID to retrieve</param>
        /// <returns>The processed signal, or null if not found</returns>
        Task<SupportSignal?> GetProcessedSignalAsync(string signalId);

        /// <summary>
        /// Get signals filtered by category with categorization and triage applied
        /// </summary>
        /// <param name="category">Category to filter by (case-insensitive)</param>
        /// <returns>Collection of signals matching the specified category</returns>
        Task<IEnumerable<SupportSignal>> GetProcessedSignalsByCategoryAsync(string category);

        /// <summary>
        /// Get raw signals from the provider (without additional processing)
        /// Used for scenarios where manual processing is needed
        /// </summary>
        /// <returns>Raw signals from the provider</returns>
        Task<IEnumerable<SupportSignal>> GetRawSignalsAsync();
    }
}
