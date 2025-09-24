using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using System.Text.RegularExpressions;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Enhanced pattern recognition engine with confidence scoring, similarity matching,
    /// and adaptive learning capabilities. Prepares foundation for ML integration.
    /// </summary>
    public class EnhancedPatternRecognitionEngine : ICategorizer
    {
        private readonly IConfigurationService _configurationService;
        private readonly string _teamName;
        private readonly Dictionary<string, PatternLearningData> _patternMemory;
        private readonly Dictionary<string, double> _categorySuccessRates;

        public EnhancedPatternRecognitionEngine(IConfigurationService configurationService, string teamName)
        {
            _configurationService = configurationService;
            _teamName = teamName;
            _patternMemory = new Dictionary<string, PatternLearningData>();
            _categorySuccessRates = new Dictionary<string, double>();
        }

        public async Task<string?> CategorizeSignalAsync(SupportSignal signal)
        {
            if (signal == null) return null;

            var categories = await _configurationService.GetActiveCategoriesAsync(_teamName);
            var categoryList = categories.Where(c => c.IsActive).ToList(); // Extra safety check for active categories

            if (!categoryList.Any()) return null;

            var content = $"{signal.Title} {signal.Description}";
            if (string.IsNullOrWhiteSpace(content)) return null;

            // Enhanced categorization with confidence scoring
            var categoryScores = await CalculateEnhancedCategoryScores(content, categoryList, signal);
            
            if (!categoryScores.Any()) return null;

            // Apply confidence threshold (minimum 30% confidence)
            var confidentMatches = categoryScores.Where(cs => cs.ConfidenceScore >= 0.3).ToList();
            if (!confidentMatches.Any())
            {
                // Return null if no confident matches
                if (categoryScores.Any())
                {
                    var bestMatch = categoryScores.OrderByDescending(cs => cs.ConfidenceScore).First();
                    await RecordUncertainClassification(signal.Id, bestMatch.Category, bestMatch.ConfidenceScore);
                }
                return null;
            }

            // Return highest confidence match
            var topMatch = confidentMatches.OrderByDescending(cs => cs.ConfidenceScore).First();
            await RecordSuccessfulClassification(signal.Id, topMatch.Category, topMatch.ConfidenceScore);
            
            return topMatch.Category;
        }

        public string? CategorizeSignal(SupportSignal signal)
        {
            return CategorizeSignalAsync(signal).GetAwaiter().GetResult();
        }

        /// <summary>
        /// Calculate enhanced category scores using multiple pattern recognition techniques
        /// </summary>
        private async Task<List<CategoryScore>> CalculateEnhancedCategoryScores(
            string content, 
            List<CategoryConfiguration> categories, 
            SupportSignal signal)
        {
            var scores = new List<CategoryScore>();
            var contentLower = content.ToLower();

            foreach (var category in categories)
            {
                var score = new CategoryScore { Category = category.Name };

                // 1. Exact keyword matching (existing functionality)
                var exactMatches = category.Keywords.Count(keyword => 
                    contentLower.Contains(keyword.ToLower(), StringComparison.OrdinalIgnoreCase));
                var exactMatchScore = (double)exactMatches / category.Keywords.Count;

                // 2. Fuzzy string matching for typos and variations
                var fuzzyScore = CalculateFuzzyMatchScore(contentLower, category.Keywords);

                // 3. Pattern-based matching (regex patterns, technical terms)
                var patternScore = CalculatePatternMatchScore(content, category);

                // 4. Historical success rate for this category
                var historicalScore = GetCategorySuccessRate(category.Name);

                // 5. Semantic similarity (preparing for ML integration)
                var semanticScore = await CalculateSemanticSimilarityScore(content, category);

                // 6. Context-aware scoring (time, source, etc.)
                var contextScore = CalculateContextualScore(signal, category);

                // Weighted combination of all scores
                var combinedScore = 
                    (exactMatchScore * 0.35) +      // Strong weight for exact matches
                    (fuzzyScore * 0.15) +           // Moderate weight for fuzzy matches
                    (patternScore * 0.20) +         // Good weight for pattern matches
                    (historicalScore * 0.10) +      // Small weight for historical success
                    (semanticScore * 0.15) +        // Preparing for ML semantic analysis
                    (contextScore * 0.05);          // Small weight for context

                // Apply priority bonus (lower priority number = higher importance)
                var priorityMultiplier = 1.0 + (1.0 / Math.Max(category.Priority, 1)) * 0.1;
                score.ConfidenceScore = Math.Min(combinedScore * priorityMultiplier, 1.0);

                // Store reasoning for explainability
                score.Reasoning = $"Exact: {exactMatchScore:P0}, Fuzzy: {fuzzyScore:P0}, " +
                                 $"Pattern: {patternScore:P0}, Historical: {historicalScore:P0}, " +
                                 $"Semantic: {semanticScore:P0}, Context: {contextScore:P0}";

                if (score.ConfidenceScore > 0)
                    scores.Add(score);
            }

            return scores;
        }

        /// <summary>
        /// Calculate fuzzy string matching score for handling typos and variations
        /// </summary>
        private double CalculateFuzzyMatchScore(string content, List<string> keywords)
        {
            if (!keywords.Any()) return 0.0;

            var totalScore = 0.0;
            var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            foreach (var keyword in keywords)
            {
                var bestWordMatch = 0.0;
                foreach (var word in words)
                {
                    var similarity = CalculateLevenshteinSimilarity(word.ToLower(), keyword.ToLower());
                    if (similarity > bestWordMatch)
                        bestWordMatch = similarity;
                }
                totalScore += bestWordMatch;
            }

            return totalScore / keywords.Count;
        }

        /// <summary>
        /// Calculate pattern-based matching using regex and technical patterns
        /// </summary>
        private double CalculatePatternMatchScore(string content, CategoryConfiguration category)
        {
            var score = 0.0;
            var patternCount = 0;

            // Define common patterns for different categories
            var patterns = GetCategoryPatterns(category.Name);
            
            foreach (var pattern in patterns)
            {
                patternCount++;
                if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
                {
                    score += 1.0;
                }
            }

            return patternCount > 0 ? score / patternCount : 0.0;
        }

        /// <summary>
        /// Get regex patterns for specific categories
        /// </summary>
        private List<string> GetCategoryPatterns(string categoryName)
        {
            return categoryName.ToLower() switch
            {
                "api" => new List<string>
                {
                    @"\b(endpoint|api|rest|http|json|xml)\b",
                    @"\b\d{3}\s?(error|status)\b", // HTTP status codes
                    @"[A-Z]{3,10}_[A-Z_]+", // API constants
                },
                "certificate" => new List<string>
                {
                    @"\b(ssl|tls|cert|certificate|x509|pem|pfx)\b",
                    @"\b(expired?|expir(y|ing)|renew|invalid)\b.*\b(cert|certificate)\b",
                    @"thumbprint\s*:?\s*[A-F0-9]+",
                },
                "performance" => new List<string>
                {
                    @"\b(slow|timeout|latency|performance|cpu|memory|disk)\b",
                    @"\b\d+\s*(ms|seconds?|minutes?)\b",
                    @"\b(high|low|spike|peak)\s+(usage|load|utilization)\b",
                },
                "database" => new List<string>
                {
                    @"\b(sql|database|db|query|connection|deadlock)\b",
                    @"\b(select|insert|update|delete|from|where)\b",
                    @"ORA-\d+|ERROR \d+", // Database error codes
                },
                _ => new List<string>()
            };
        }

        /// <summary>
        /// Placeholder for semantic similarity calculation (ML integration point)
        /// </summary>
        private Task<double> CalculateSemanticSimilarityScore(string content, CategoryConfiguration category)
        {
            // TODO: Integrate with ML models for semantic analysis
            // For now, use a simple word embedding similarity approximation
            
            var categoryTerms = string.Join(" ", category.Keywords).ToLower();
            var contentWords = content.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries).ToHashSet();
            var categoryWords = categoryTerms.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToHashSet();
            
            var intersection = contentWords.Intersect(categoryWords).Count();
            var union = contentWords.Union(categoryWords).Count();
            
            var result = union > 0 ? (double)intersection / union : 0.0;
            return Task.FromResult(result);
        }

        /// <summary>
        /// Calculate contextual scoring based on signal metadata
        /// </summary>
        private double CalculateContextualScore(SupportSignal signal, CategoryConfiguration category)
        {
            var score = 0.0;
            
            // Time-based scoring (recent issues might be more likely to be similar categories)
            var timeSinceSignal = DateTime.UtcNow - signal.Timestamp;
            if (timeSinceSignal.TotalHours < 24)
                score += 0.2; // Recent signals get slight boost
            
            // Source-based scoring (different sources might have different patterns)
            var sourceBonus = signal.Source.ToLower() switch
            {
                "teams" when category.Name.Contains("Certificate") => 0.3,
                "jira" when category.Name.Contains("API") => 0.2,
                _ => 0.0
            };
            score += sourceBonus;
            
            return Math.Min(score, 1.0);
        }

        /// <summary>
        /// Calculate Levenshtein distance-based similarity
        /// </summary>
        private double CalculateLevenshteinSimilarity(string source, string target)
        {
            if (source == target) return 1.0;
            
            var distance = CalculateLevenshteinDistance(source, target);
            var maxLength = Math.Max(source.Length, target.Length);
            
            if (maxLength == 0) return 1.0;
            
            return 1.0 - (double)distance / maxLength;
        }

        /// <summary>
        /// Calculate Levenshtein distance between two strings
        /// </summary>
        private int CalculateLevenshteinDistance(string source, string target)
        {
            if (source.Length == 0) return target.Length;
            if (target.Length == 0) return source.Length;

            var matrix = new int[source.Length + 1, target.Length + 1];

            for (int i = 0; i <= source.Length; i++)
                matrix[i, 0] = i;
            for (int j = 0; j <= target.Length; j++)
                matrix[0, j] = j;

            for (int i = 1; i <= source.Length; i++)
            {
                for (int j = 1; j <= target.Length; j++)
                {
                    var cost = (target[j - 1] == source[i - 1]) ? 0 : 1;
                    matrix[i, j] = Math.Min(Math.Min(
                        matrix[i - 1, j] + 1,
                        matrix[i, j - 1] + 1),
                        matrix[i - 1, j - 1] + cost);
                }
            }

            return matrix[source.Length, target.Length];
        }

        /// <summary>
        /// Get historical success rate for a category
        /// </summary>
        private double GetCategorySuccessRate(string categoryName)
        {
            return _categorySuccessRates.GetValueOrDefault(categoryName, 0.5); // Default 50%
        }

        /// <summary>
        /// Record successful classification for learning
        /// </summary>
        private Task RecordSuccessfulClassification(string signalId, string category, double confidence)
        {
            // Update success rate
            if (!_categorySuccessRates.ContainsKey(category))
                _categorySuccessRates[category] = 0.5;
            
            _categorySuccessRates[category] = (_categorySuccessRates[category] * 0.9) + (confidence * 0.1);
            
            // TODO: Store in database for persistent learning
            return Task.CompletedTask;
        }

        /// <summary>
        /// Record uncertain classification for improvement
        /// </summary>
        private Task RecordUncertainClassification(string signalId, string category, double confidence)
        {
            // TODO: Flag for manual review and learning
            // TODO: Store uncertainty data for ML training
            return Task.CompletedTask;
        }

        /// <summary>
        /// Generate pattern suggestions for new teams
        /// </summary>
        public Task<List<CategorySuggestion>> GenerateNewTeamCategorySuggestions(
            List<SupportSignal> sampleSignals, 
            List<string> existingTeamNames)
        {
            var suggestions = new List<CategorySuggestion>();
            
            // Analyze signal patterns to suggest categories
            var patterns = AnalyzeSignalPatterns(sampleSignals);
            
            // Compare with existing team configurations for inspiration
            var existingPatterns = GetExistingTeamPatterns(existingTeamNames).GetAwaiter().GetResult();
            
            // Generate category suggestions based on patterns
            foreach (var pattern in patterns.Take(10)) // Top 10 patterns
            {
                var suggestion = new CategorySuggestion
                {
                    CategoryName = pattern.SuggestedName,
                    Description = pattern.Description,
                    Keywords = pattern.Keywords,
                    Confidence = pattern.Confidence,
                    SampleSignals = pattern.ExampleSignals.Take(3).ToList(),
                    ReasoningExplanation = pattern.Reasoning
                };
                
                suggestions.Add(suggestion);
            }
            
            return Task.FromResult(suggestions.OrderByDescending(s => s.Confidence).ToList());
        }

        private List<PatternAnalysis> AnalyzeSignalPatterns(List<SupportSignal> signals)
        {
            // TODO: Implement sophisticated pattern analysis
            // For now, return placeholder implementation
            return new List<PatternAnalysis>();
        }

        private Task<List<TeamPatternData>> GetExistingTeamPatterns(List<string> teamNames)
        {
            // TODO: Analyze existing team configurations for pattern reuse
            return Task.FromResult(new List<TeamPatternData>());
        }

        private static DateTime ParseTimestamp(string timestamp)
        {
            return DateTime.TryParse(timestamp, out var result) ? result : DateTime.UtcNow;
        }
    }

    // Supporting classes for enhanced pattern recognition
    public class CategoryScore
    {
        public string Category { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public string Reasoning { get; set; } = string.Empty;
    }

    public class PatternLearningData
    {
        public string Pattern { get; set; } = string.Empty;
        public double SuccessRate { get; set; }
        public int UsageCount { get; set; }
        public DateTime LastUsed { get; set; }
    }

    public class CategorySuggestion
    {
        public string CategoryName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new();
        public double Confidence { get; set; }
        public List<SupportSignal> SampleSignals { get; set; } = new();
        public string ReasoningExplanation { get; set; } = string.Empty;
    }

    public class PatternAnalysis
    {
        public string SuggestedName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Keywords { get; set; } = new();
        public double Confidence { get; set; }
        public List<SupportSignal> ExampleSignals { get; set; } = new();
        public string Reasoning { get; set; } = string.Empty;
    }

    public class TeamPatternData
    {
        public string TeamName { get; set; } = string.Empty;
        public List<string> CommonPatterns { get; set; } = new();
        public Dictionary<string, double> CategoryEffectiveness { get; set; } = new();
    }
}
