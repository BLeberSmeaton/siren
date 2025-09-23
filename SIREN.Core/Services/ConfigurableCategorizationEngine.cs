using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Configuration-driven categorization engine that uses team-specific categories
    /// Replaces hardcoded CategoryEngine with dynamic, extensible categorization
    /// </summary>
    public class ConfigurableCategorizationEngine : ICategorizer
    {
        private readonly IConfigurationService _configurationService;
        private readonly string _teamName;

        public ConfigurableCategorizationEngine(IConfigurationService configurationService, string teamName)
        {
            _configurationService = configurationService;
            _teamName = teamName;
        }

        public async Task<string?> CategorizeSignalAsync(SupportSignal signal)
        {
            if (signal == null)
                return null;

            var categories = await _configurationService.GetActiveCategoriesAsync(_teamName);
            var categoryList = categories.ToList();

            if (!categoryList.Any())
                return null;

            // Combine title and description for analysis
            var content = $"{signal.Title} {signal.Description}".ToLower();
            
            if (string.IsNullOrWhiteSpace(content))
                return null;

            // Count matches for each category
            var categoryMatches = new Dictionary<CategoryConfiguration, int>();

            foreach (var category in categoryList)
            {
                var matchCount = category.Keywords.Count(keyword => 
                    content.Contains(keyword.ToLower(), StringComparison.OrdinalIgnoreCase));
                
                if (matchCount > 0)
                {
                    categoryMatches[category] = matchCount;
                }
            }

            if (!categoryMatches.Any())
                return null;

            // Apply priority rules (lower priority number = higher priority)
            var highestPriority = categoryMatches.Keys.Min(c => c.Priority);
            var priorityCategories = categoryMatches.Where(kv => kv.Key.Priority == highestPriority).ToList();

            // If only one priority category, return it
            if (priorityCategories.Count == 1)
                return priorityCategories.First().Key.Name;

            // Among equal priority categories, choose the one with most matches
            var maxMatches = priorityCategories.Max(kv => kv.Value);
            var topMatches = priorityCategories.Where(kv => kv.Value == maxMatches).ToList();

            // If still tied, return first alphabetically for consistency
            return topMatches.OrderBy(kv => kv.Key.Name).First().Key.Name;
        }

        /// <summary>
        /// Synchronous version for backward compatibility
        /// </summary>
        public string? CategorizeSignal(SupportSignal signal)
        {
            // For now, use async version synchronously
            // In production, consider making ICategorizer async
            return CategorizeSignalAsync(signal).GetAwaiter().GetResult();
        }
    }

    /// <summary>
    /// Multi-team categorization engine that can categorize signals for any team
    /// </summary>
    public class MultiTeamCategorizationEngine
    {
        private readonly IConfigurationService _configurationService;
        private readonly Dictionary<string, ConfigurableCategorizationEngine> _teamEngines;

        public MultiTeamCategorizationEngine(IConfigurationService configurationService)
        {
            _configurationService = configurationService;
            _teamEngines = new Dictionary<string, ConfigurableCategorizationEngine>();
        }

        /// <summary>
        /// Get or create a categorization engine for a specific team
        /// </summary>
        public ConfigurableCategorizationEngine GetEngineForTeam(string teamName)
        {
            if (!_teamEngines.TryGetValue(teamName, out var engine))
            {
                engine = new ConfigurableCategorizationEngine(_configurationService, teamName);
                _teamEngines[teamName] = engine;
            }

            return engine;
        }

        /// <summary>
        /// Categorize a signal for a specific team
        /// </summary>
        public async Task<string?> CategorizeSignalForTeamAsync(SupportSignal signal, string teamName)
        {
            var engine = GetEngineForTeam(teamName);
            return await engine.CategorizeSignalAsync(signal);
        }
    }
}
