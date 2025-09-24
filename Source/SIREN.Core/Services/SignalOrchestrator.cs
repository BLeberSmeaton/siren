using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Centralized orchestrator for signal processing operations.
    /// Eliminates code duplication by providing a single point for:
    /// - Signal retrieval
    /// - Automatic categorization
    /// - Manual triage data application
    /// 
    /// Follows Single Responsibility Principle by focusing solely on signal orchestration.
    /// </summary>
    public class SignalOrchestrator : ISignalOrchestrator
    {
        private readonly ISignalProvider _signalProvider;
        private readonly ICategorizer _categorizer;
        private readonly IManualTriageService _manualTriageService;

        public SignalOrchestrator(
            ISignalProvider signalProvider,
            ICategorizer categorizer,
            IManualTriageService manualTriageService)
        {
            _signalProvider = signalProvider ?? throw new ArgumentNullException(nameof(signalProvider));
            _categorizer = categorizer ?? throw new ArgumentNullException(nameof(categorizer));
            _manualTriageService = manualTriageService ?? throw new ArgumentNullException(nameof(manualTriageService));
        }

        /// <summary>
        /// Get all signals with full processing applied
        /// </summary>
        public async Task<IEnumerable<SupportSignal>> GetProcessedSignalsAsync()
        {
            var signals = await GetRawSignalsAsync();
            return ProcessSignals(signals, applyTriageData: true);
        }

        /// <summary>
        /// Get a specific signal by ID with categorization applied
        /// </summary>
        public async Task<SupportSignal?> GetProcessedSignalAsync(string signalId)
        {
            if (string.IsNullOrWhiteSpace(signalId))
                return null;

            var signals = await GetRawSignalsAsync();
            var signal = signals.FirstOrDefault(s => s.Id == signalId);

            if (signal == null)
                return null;

            // Apply categorization to the single signal
            ApplyCategorization(signal);
            
            return signal;
        }

        /// <summary>
        /// Get signals filtered by category with full processing applied
        /// </summary>
        public async Task<IEnumerable<SupportSignal>> GetProcessedSignalsByCategoryAsync(string category)
        {
            if (string.IsNullOrWhiteSpace(category))
                return Enumerable.Empty<SupportSignal>();

            var processedSignals = await GetProcessedSignalsAsync();
            
            return processedSignals.Where(s => 
                string.Equals(s.Category, category, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Get raw signals from provider without additional processing
        /// </summary>
        public async Task<IEnumerable<SupportSignal>> GetRawSignalsAsync()
        {
            return await _signalProvider.GetSignalsAsync();
        }

        /// <summary>
        /// Process a collection of signals with categorization and optional triage data
        /// </summary>
        /// <param name="signals">Raw signals to process</param>
        /// <param name="applyTriageData">Whether to apply manual triage data</param>
        /// <returns>Processed signals</returns>
        private IEnumerable<SupportSignal> ProcessSignals(IEnumerable<SupportSignal> signals, bool applyTriageData = true)
        {
            var signalList = signals.ToList();

            // Apply automatic categorization to signals missing categories
            foreach (var signal in signalList)
            {
                ApplyCategorization(signal);
            }

            // Apply manual triage data if requested
            if (applyTriageData)
            {
                signalList = _manualTriageService.ApplyManualTriageData(signalList).ToList();
            }

            return signalList;
        }

        /// <summary>
        /// Apply automatic categorization to a signal if it doesn't have a category
        /// </summary>
        /// <param name="signal">Signal to categorize</param>
        private void ApplyCategorization(SupportSignal signal)
        {
            if (signal != null && string.IsNullOrEmpty(signal.Category))
            {
                signal.Category = _categorizer.CategorizeSignal(signal);
            }
        }
    }
}
