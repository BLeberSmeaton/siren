using Microsoft.AspNetCore.Mvc;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ISignalProvider _signalProvider;
        private readonly ICategorizer _categorizer;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(
            ISignalProvider signalProvider,
            ICategorizer categorizer,
            ILogger<CategoriesController> logger)
        {
            _signalProvider = signalProvider;
            _categorizer = categorizer;
            _logger = logger;
        }

        /// <summary>
        /// Get all unique categories from signals
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
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

                var categories = signalList
                    .Where(s => !string.IsNullOrEmpty(s.Category))
                    .Select(s => s.Category!)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToList();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading categories");
                return StatusCode(500, "Internal server error while loading categories");
            }
        }

        /// <summary>
        /// Get category statistics with signal counts
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<IEnumerable<CategoryStats>>> GetCategoryStats()
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

                var categoryStats = signalList
                    .Where(s => !string.IsNullOrEmpty(s.Category))
                    .GroupBy(s => s.Category!)
                    .Select(g => new CategoryStats
                    {
                        Category = g.Key,
                        Count = g.Count(),
                        ManuallyScored = g.Count(s => s.ManualScore.HasValue),
                        AverageManualScore = g.Where(s => s.ManualScore.HasValue)
                                           .Select(s => s.ManualScore!.Value)
                                           .DefaultIfEmpty(0)
                                           .Average(),
                        LatestSignal = g.Max(s => s.Timestamp)
                    })
                    .OrderByDescending(c => c.Count)
                    .ToList();

                return Ok(categoryStats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading category statistics");
                return StatusCode(500, "Internal server error while loading category statistics");
            }
        }

        /// <summary>
        /// Manually categorize a specific signal (override AI categorization)
        /// </summary>
        [HttpPost("categorize/{signalId}")]
        public async Task<ActionResult<SupportSignal>> CategorizeSignal(string signalId, [FromBody] CategorizeRequest request)
        {
            try
            {
                var signals = await _signalProvider.GetSignalsAsync();
                var signal = signals.FirstOrDefault(s => s.Id == signalId);

                if (signal == null)
                {
                    return NotFound($"Signal with ID '{signalId}' not found");
                }

                // Apply manual categorization or auto-categorize
                if (request.UseAutoCategorization)
                {
                    signal.Category = _categorizer.CategorizeSignal(signal);
                }
                else
                {
                    signal.Category = request.Category;
                }

                _logger.LogInformation("Signal {SignalId} categorized as {Category} (manual: {IsManual})", 
                    signalId, signal.Category, !request.UseAutoCategorization);

                return Ok(signal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error categorizing signal {SignalId}", signalId);
                return StatusCode(500, "Internal server error while categorizing signal");
            }
        }
    }

    // DTOs for category operations
    public class CategoryStats
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
        public int ManuallyScored { get; set; }
        public double AverageManualScore { get; set; }
        public DateTime LatestSignal { get; set; }
    }

    public class CategorizeRequest
    {
        public string? Category { get; set; }
        public bool UseAutoCategorization { get; set; }
    }
}
