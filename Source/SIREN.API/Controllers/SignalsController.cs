using Microsoft.AspNetCore.Mvc;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SignalsController : ControllerBase
    {
        private readonly ISignalProvider _signalProvider;
        private readonly ICategorizer _categorizer;
        private readonly ILogger<SignalsController> _logger;
        private readonly IManualTriageService _manualTriageService;

        public SignalsController(
            ISignalProvider signalProvider, 
            ICategorizer categorizer,
            ILogger<SignalsController> logger,
            IManualTriageService manualTriageService)
        {
            _signalProvider = signalProvider;
            _categorizer = categorizer;
            _logger = logger;
            _manualTriageService = manualTriageService;
        }

        /// <summary>
        /// Get all signals with automatic categorization applied
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupportSignal>>> GetSignals()
        {
            try
            {
                _logger.LogInformation("Loading signals from {ProviderName}", _signalProvider.ProviderName);
                
                var signals = await _signalProvider.GetSignalsAsync();
                var signalList = signals.ToList();

                // Auto-categorize signals that don't have a category
                foreach (var signal in signalList)
                {
                    if (string.IsNullOrEmpty(signal.Category))
                    {
                        signal.Category = _categorizer.CategorizeSignal(signal);
                    }
                }
                
                // Apply manual triage data (scores and category overrides)
                signalList = _manualTriageService.ApplyManualTriageData(signalList).ToList();

                _logger.LogInformation("Successfully loaded and categorized {Count} signals", signalList.Count);
                return Ok(signalList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading signals");
                return StatusCode(500, "Internal server error while loading signals");
            }
        }

        /// <summary>
        /// Get a specific signal by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SupportSignal>> GetSignal(string id)
        {
            try
            {
                var signals = await _signalProvider.GetSignalsAsync();
                var signal = signals.FirstOrDefault(s => s.Id == id);

                if (signal == null)
                {
                    return NotFound($"Signal with ID '{id}' not found");
                }

                // Auto-categorize if needed
                if (string.IsNullOrEmpty(signal.Category))
                {
                    signal.Category = _categorizer.CategorizeSignal(signal);
                }

                return Ok(signal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading signal {SignalId}", id);
                return StatusCode(500, "Internal server error while loading signal");
            }
        }

        /// <summary>
        /// Update manual scoring for a signal (key triage feature)
        /// </summary>
        [HttpPut("{id}/manual-score")]
        public async Task<ActionResult<SupportSignal>> UpdateManualScore(string id, [FromBody] ManualScoreRequest request)
        {
            try
            {
                var signals = await _signalProvider.GetSignalsAsync();
                var signal = signals.FirstOrDefault(s => s.Id == id);

                if (signal == null)
                {
                    return NotFound($"Signal with ID '{id}' not found");
                }

                // Persist manual score using the triage service
                await _manualTriageService.UpdateManualScoreAsync(id, request.Score);
                
                // Update the signal object with the new score
                signal.ManualScore = request.Score;

                _logger.LogInformation("Updated manual score for signal {SignalId} to {Score}", id, request.Score);
                
                return Ok(signal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating manual score for signal {SignalId}", id);
                return StatusCode(500, "Internal server error while updating signal");
            }
        }

        /// <summary>
        /// Get signals filtered by category
        /// </summary>
        [HttpGet("by-category/{category}")]
        public async Task<ActionResult<IEnumerable<SupportSignal>>> GetSignalsByCategory(string category)
        {
            try
            {
                var signals = await _signalProvider.GetSignalsAsync();
                var signalList = signals.ToList();

                // Auto-categorize signals that don't have a category
                foreach (var signal in signalList)
                {
                    if (string.IsNullOrEmpty(signal.Category))
                    {
                        signal.Category = _categorizer.CategorizeSignal(signal);
                    }
                }

                var filteredSignals = signalList.Where(s => 
                    string.Equals(s.Category, category, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                return Ok(filteredSignals);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading signals by category {Category}", category);
                return StatusCode(500, "Internal server error while filtering signals");
            }
        }

        /// <summary>
        /// Get summary statistics for dashboard
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<SignalSummary>> GetSummary()
        {
            try
            {
                var signals = await _signalProvider.GetSignalsAsync();
                var signalList = signals.ToList();

                // Auto-categorize for accurate stats
                foreach (var signal in signalList)
                {
                    if (string.IsNullOrEmpty(signal.Category))
                    {
                        signal.Category = _categorizer.CategorizeSignal(signal);
                    }
                }
                
                // Apply manual triage data for accurate statistics
                signalList = _manualTriageService.ApplyManualTriageData(signalList).ToList();

                var summary = new SignalSummary
                {
                    TotalSignals = signalList.Count,
                    CategorizedSignals = signalList.Count(s => !string.IsNullOrEmpty(s.Category)),
                    UncategorizedSignals = signalList.Count(s => string.IsNullOrEmpty(s.Category)),
                    ManuallyScored = signalList.Count(s => s.ManualScore.HasValue),
                    Categories = signalList
                        .Where(s => !string.IsNullOrEmpty(s.Category))
                        .GroupBy(s => s.Category)
                        .Select(g => new CategoryCount { Category = g.Key!, Count = g.Count() })
                        .OrderByDescending(c => c.Count)
                        .ToList()
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating signal summary");
                return StatusCode(500, "Internal server error while generating summary");
            }
        }
    }

    // DTOs for API responses
    public class ManualScoreRequest
    {
        public double Score { get; set; }
    }

    public class SignalSummary
    {
        public int TotalSignals { get; set; }
        public int CategorizedSignals { get; set; }
        public int UncategorizedSignals { get; set; }
        public int ManuallyScored { get; set; }
        public List<CategoryCount> Categories { get; set; } = new();
    }

    public class CategoryCount
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
