using SIREN.Core.Models;
using SIREN.Core.Services;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Interface for manual triage service operations
    /// </summary>
    public interface IManualTriageService
    {
        /// <summary>
        /// Update manual score for a signal
        /// </summary>
        Task UpdateManualScoreAsync(string signalId, double score);

        /// <summary>
        /// Update manual category for a signal
        /// </summary>
        Task UpdateManualCategoryAsync(string signalId, string category);

        /// <summary>
        /// Get manual triage data for a signal
        /// </summary>
        ManualTriageData? GetManualTriageData(string signalId);

        /// <summary>
        /// Apply manual triage data to a collection of signals
        /// </summary>
        IEnumerable<SupportSignal> ApplyManualTriageData(IEnumerable<SupportSignal> signals);

        /// <summary>
        /// Get all manual triage data for statistics calculations
        /// </summary>
        IReadOnlyDictionary<string, ManualTriageData> GetAllManualTriageData();
    }
}
