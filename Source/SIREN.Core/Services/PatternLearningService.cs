using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using System.Text.Json;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Service for learning and adapting categorization patterns based on user feedback
    /// and signal classification history. Prepares data for ML model training.
    /// </summary>
    public class PatternLearningService
    {
        private readonly IConfigurationService _configurationService;
        private readonly string _learningDataPath;
        private readonly Dictionary<string, TeamLearningData> _teamLearningCache;

        public PatternLearningService(IConfigurationService configurationService, string? dataPath = null)
        {
            _configurationService = configurationService;
            _learningDataPath = dataPath ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "Learning");
            _teamLearningCache = new Dictionary<string, TeamLearningData>();
            
            EnsureLearningDataDirectory();
        }

        /// <summary>
        /// Record user feedback on automatic categorization
        /// </summary>
        public async Task RecordCategorizationFeedbackAsync(
            string teamName, 
            SupportSignal signal, 
            string predictedCategory, 
            string actualCategory, 
            double confidence,
            string userId = "system")
        {
            var feedback = new CategorizationFeedback
            {
                Id = Guid.NewGuid().ToString(),
                TeamName = teamName,
                SignalId = signal.Id,
                SignalTitle = signal.Title,
                SignalDescription = signal.Description,
                SignalSource = signal.Source,
                SignalTimestamp = signal.Timestamp,
                PredictedCategory = predictedCategory,
                ActualCategory = actualCategory,
                ConfidenceScore = confidence,
                IsCorrect = predictedCategory.Equals(actualCategory, StringComparison.OrdinalIgnoreCase),
                UserId = userId,
                RecordedAt = DateTime.UtcNow
            };

            await SaveFeedbackAsync(feedback);
            await UpdateTeamLearningDataAsync(teamName, feedback);
            
            // Generate improvement suggestions
            if (!feedback.IsCorrect)
            {
                await AnalyzeAndSuggestImprovements(teamName, feedback);
            }
        }

        /// <summary>
        /// Learn patterns from new team's sample data
        /// </summary>
        public async Task<NewTeamLearningResult> LearnPatternsFromSampleDataAsync(
            string proposedTeamName,
            List<SupportSignal> sampleSignals,
            List<string> existingTeamNames)
        {
            var result = new NewTeamLearningResult
            {
                TeamName = proposedTeamName,
                AnalyzedSignalCount = sampleSignals.Count,
                LearningTimestamp = DateTime.UtcNow
            };

            // 1. Extract common terms and patterns
            var termFrequency = ExtractTermFrequency(sampleSignals);
            var patterns = ExtractCommonPatterns(sampleSignals);

            // 2. Compare with existing teams to find similar patterns
            var similarTeams = await FindSimilarTeamPatternsAsync(patterns, existingTeamNames);

            // 3. Generate category suggestions based on clustering and similarity
            var suggestedCategories = await GenerateCategorySuggestionsAsync(
                sampleSignals, termFrequency, patterns, similarTeams);

            // 4. Suggest data sources based on signal sources
            var dataSources = SuggestDataSourcesFromSignals(sampleSignals);

            result.SuggestedCategories = suggestedCategories;
            result.SuggestedDataSources = dataSources;
            result.SimilarTeams = similarTeams;
            result.ConfidenceScore = CalculateOverallConfidence(suggestedCategories);

            // Save learning results for future reference
            await SaveNewTeamLearningResultAsync(result);

            return result;
        }

        /// <summary>
        /// Get learning insights for a specific team
        /// </summary>
        public async Task<TeamLearningInsights> GetTeamLearningInsightsAsync(string teamName)
        {
            var learningData = await LoadTeamLearningDataAsync(teamName);
            
            var insights = new TeamLearningInsights
            {
                TeamName = teamName,
                TotalFeedbackRecords = learningData.FeedbackHistory.Count,
                AccuracyRate = CalculateAccuracyRate(learningData.FeedbackHistory),
                CategoryAccuracy = CalculateCategoryAccuracy(learningData.FeedbackHistory),
                CommonMisclassifications = FindCommonMisclassifications(learningData.FeedbackHistory),
                SuggestedImprovements = learningData.ImprovementSuggestions.TakeLast(10).ToList(),
                PatternTrends = AnalyzePatternTrends(learningData.PatternHistory),
                LastUpdated = learningData.LastUpdated
            };

            return insights;
        }

        /// <summary>
        /// Suggest keyword improvements for existing categories
        /// </summary>
        public async Task<List<KeywordSuggestion>> SuggestKeywordImprovementsAsync(string teamName)
        {
            var learningData = await LoadTeamLearningDataAsync(teamName);
            var suggestions = new List<KeywordSuggestion>();

            // Analyze missed classifications to suggest new keywords
            var missedClassifications = learningData.FeedbackHistory
                .Where(f => !f.IsCorrect)
                .ToList();

            foreach (var categoryGroup in missedClassifications.GroupBy(f => f.ActualCategory))
            {
                var category = categoryGroup.Key;
                var missedSignals = categoryGroup.ToList();

                // Extract common terms from missed signals
                var commonTerms = ExtractCommonTermsFromSignals(
                    missedSignals.Select(f => new SupportSignal 
                    { 
                        Title = f.SignalTitle, 
                        Description = f.SignalDescription 
                    }).ToList());

                if (commonTerms.Any())
                {
                    suggestions.Add(new KeywordSuggestion
                    {
                        CategoryName = category,
                        SuggestedKeywords = commonTerms.Take(5).ToList(),
                        Confidence = CalculateKeywordConfidence(commonTerms, missedSignals.Count),
                        Reasoning = $"Found in {missedSignals.Count} misclassified signals",
                        SampleSignals = missedSignals.Take(3).Select(f => f.SignalTitle).ToList()
                    });
                }
            }

            return suggestions.OrderByDescending(s => s.Confidence).ToList();
        }

        /// <summary>
        /// Generate ML training data from learning history
        /// </summary>
        public async Task<MLTrainingDataset> GenerateMLTrainingDatasetAsync(
            List<string> teamNames, 
            DateTime? fromDate = null)
        {
            var dataset = new MLTrainingDataset
            {
                GeneratedAt = DateTime.UtcNow,
                Teams = teamNames,
                FromDate = fromDate ?? DateTime.UtcNow.AddMonths(-6)
            };

            var allFeedback = new List<CategorizationFeedback>();

            foreach (var teamName in teamNames)
            {
                var learningData = await LoadTeamLearningDataAsync(teamName);
                var relevantFeedback = learningData.FeedbackHistory
                    .Where(f => f.RecordedAt >= dataset.FromDate)
                    .ToList();
                
                allFeedback.AddRange(relevantFeedback);
            }

            // Convert to ML training format
            dataset.TrainingExamples = allFeedback.Select(f => new MLTrainingExample
            {
                Id = f.Id,
                InputText = $"{f.SignalTitle} {f.SignalDescription}",
                TrueCategory = f.ActualCategory,
                PredictedCategory = f.PredictedCategory,
                TeamContext = f.TeamName,
                Source = f.SignalSource,
                Timestamp = f.SignalTimestamp,
                WasCorrect = f.IsCorrect,
                ConfidenceScore = f.ConfidenceScore,
                Metadata = f.AdditionalMetadata
            }).ToList();

            dataset.CategoryDistribution = allFeedback
                .GroupBy(f => f.ActualCategory)
                .ToDictionary(g => g.Key, g => g.Count());

            dataset.TeamDistribution = allFeedback
                .GroupBy(f => f.TeamName)
                .ToDictionary(g => g.Key, g => g.Count());

            // Save dataset for ML training
            await SaveMLTrainingDatasetAsync(dataset);

            return dataset;
        }

        #region Private Helper Methods

        private void EnsureLearningDataDirectory()
        {
            if (!Directory.Exists(_learningDataPath))
            {
                Directory.CreateDirectory(_learningDataPath);
            }
        }

        private async Task SaveFeedbackAsync(CategorizationFeedback feedback)
        {
            var filePath = Path.Combine(_learningDataPath, $"feedback_{DateTime.UtcNow:yyyyMM}.json");
            
            List<CategorizationFeedback> existingFeedback = new();
            if (File.Exists(filePath))
            {
                var existingJson = await File.ReadAllTextAsync(filePath);
                existingFeedback = JsonSerializer.Deserialize<List<CategorizationFeedback>>(existingJson) ?? new();
            }

            existingFeedback.Add(feedback);
            
            var json = JsonSerializer.Serialize(existingFeedback, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }

        private async Task<TeamLearningData> LoadTeamLearningDataAsync(string teamName)
        {
            if (_teamLearningCache.TryGetValue(teamName, out var cached))
                return cached;

            var filePath = Path.Combine(_learningDataPath, $"team_{teamName}_learning.json");
            
            if (!File.Exists(filePath))
            {
                return new TeamLearningData { TeamName = teamName };
            }

            var json = await File.ReadAllTextAsync(filePath);
            var data = JsonSerializer.Deserialize<TeamLearningData>(json) ?? new TeamLearningData { TeamName = teamName };
            
            _teamLearningCache[teamName] = data;
            return data;
        }

        private async Task UpdateTeamLearningDataAsync(string teamName, CategorizationFeedback feedback)
        {
            var learningData = await LoadTeamLearningDataAsync(teamName);
            learningData.FeedbackHistory.Add(feedback);
            learningData.LastUpdated = DateTime.UtcNow;

            // Keep only recent history (last 1000 records)
            if (learningData.FeedbackHistory.Count > 1000)
            {
                learningData.FeedbackHistory = learningData.FeedbackHistory
                    .OrderByDescending(f => f.RecordedAt)
                    .Take(1000)
                    .ToList();
            }

            _teamLearningCache[teamName] = learningData;
            
            var filePath = Path.Combine(_learningDataPath, $"team_{teamName}_learning.json");
            var json = JsonSerializer.Serialize(learningData, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }

        private Dictionary<string, int> ExtractTermFrequency(List<SupportSignal> signals)
        {
            var termFreq = new Dictionary<string, int>();
            
            foreach (var signal in signals)
            {
                var text = $"{signal.Title} {signal.Description}".ToLower();
                var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                    .Where(w => w.Length > 3) // Filter out short words
                    .Where(w => !IsStopWord(w)); // Filter out stop words

                foreach (var word in words)
                {
                    termFreq[word] = termFreq.GetValueOrDefault(word, 0) + 1;
                }
            }

            return termFreq.Where(kvp => kvp.Value >= 2) // Appear at least twice
                          .OrderByDescending(kvp => kvp.Value)
                          .Take(100) // Top 100 terms
                          .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        private List<string> ExtractCommonPatterns(List<SupportSignal> signals)
        {
            var patterns = new List<string>();
            
            // TODO: Implement sophisticated pattern extraction
            // For now, return basic technical patterns
            patterns.AddRange(new[]
            {
                @"\b\d{3}\s?error\b", // HTTP errors
                @"\b[A-Z]{3,}_[A-Z_]+\b", // Constants
                @"\b(failed|error|timeout|exception)\b", // Error keywords
                @"\b\d+\.\d+\.\d+\.\d+\b", // IP addresses
                @"\b[a-zA-Z]+://[^\s]+\b" // URLs
            });

            return patterns;
        }

        private bool IsStopWord(string word)
        {
            var stopWords = new HashSet<string>
            {
                "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
                "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
                "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "will", "would", "could", "should"
            };
            
            return stopWords.Contains(word.ToLower());
        }

        private double CalculateAccuracyRate(List<CategorizationFeedback> feedback)
        {
            if (!feedback.Any()) return 0.0;
            return (double)feedback.Count(f => f.IsCorrect) / feedback.Count;
        }

        private Dictionary<string, double> CalculateCategoryAccuracy(List<CategorizationFeedback> feedback)
        {
            return feedback.GroupBy(f => f.ActualCategory)
                          .ToDictionary(
                              g => g.Key,
                              g => (double)g.Count(f => f.IsCorrect) / g.Count()
                          );
        }

        private List<MisclassificationPattern> FindCommonMisclassifications(List<CategorizationFeedback> feedback)
        {
            return feedback.Where(f => !f.IsCorrect)
                          .GroupBy(f => new { f.PredictedCategory, f.ActualCategory })
                          .Where(g => g.Count() >= 2)
                          .Select(g => new MisclassificationPattern
                          {
                              PredictedCategory = g.Key.PredictedCategory,
                              ActualCategory = g.Key.ActualCategory,
                              Count = g.Count(),
                              ExampleSignals = g.Take(3).Select(f => f.SignalTitle).ToList()
                          })
                          .OrderByDescending(p => p.Count)
                          .ToList();
        }

        private Task AnalyzeAndSuggestImprovements(string teamName, CategorizationFeedback feedback)
        {
            // TODO: Implement intelligent improvement suggestions
            // This could analyze the misclassification and suggest keyword additions or pattern changes
            return Task.CompletedTask;
        }

        private async Task SaveMLTrainingDatasetAsync(MLTrainingDataset dataset)
        {
            var filePath = Path.Combine(_learningDataPath, $"ml_training_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json");
            var json = JsonSerializer.Serialize(dataset, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }

        private async Task SaveNewTeamLearningResultAsync(NewTeamLearningResult result)
        {
            var filePath = Path.Combine(_learningDataPath, $"new_team_{result.TeamName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json");
            var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(filePath, json);
        }

        // Placeholder implementations for complex methods
        private Task<List<CategoryConfiguration>> GenerateCategorySuggestionsAsync(
            List<SupportSignal> signals, 
            Dictionary<string, int> termFreq, 
            List<string> patterns, 
            List<SimilarTeam> similarTeams)
        {
            // TODO: Implement sophisticated category generation
            return Task.FromResult(new List<CategoryConfiguration>());
        }

        private List<DataSourceConfiguration> SuggestDataSourcesFromSignals(List<SupportSignal> signals)
        {
            // TODO: Suggest data sources based on signal sources
            return new List<DataSourceConfiguration>();
        }

        private Task<List<SimilarTeam>> FindSimilarTeamPatternsAsync(List<string> patterns, List<string> teamNames)
        {
            // TODO: Compare patterns with existing teams
            return Task.FromResult(new List<SimilarTeam>());
        }

        private double CalculateOverallConfidence(List<CategoryConfiguration> categories)
        {
            // TODO: Calculate confidence based on category quality
            return 0.7; // Placeholder
        }

        private List<PatternTrend> AnalyzePatternTrends(List<PatternHistory> history)
        {
            // TODO: Analyze pattern evolution over time
            return new List<PatternTrend>();
        }

        private List<string> ExtractCommonTermsFromSignals(List<SupportSignal> signals)
        {
            var termFreq = ExtractTermFrequency(signals);
            return termFreq.Keys.Take(10).ToList();
        }

        private double CalculateKeywordConfidence(List<string> terms, int sampleSize)
        {
            // Simple confidence based on term frequency and sample size
            return Math.Min(1.0, (double)terms.Count / 10 * Math.Min(sampleSize, 5) / 5);
        }

        private static DateTime ParseTimestamp(string timestamp)
        {
            return DateTime.TryParse(timestamp, out var result) ? result : DateTime.UtcNow;
        }

        #endregion
    }

    // Supporting data classes
    public class CategorizationFeedback
    {
        public string Id { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public string SignalId { get; set; } = string.Empty;
        public string SignalTitle { get; set; } = string.Empty;
        public string SignalDescription { get; set; } = string.Empty;
        public string SignalSource { get; set; } = string.Empty;
        public DateTime SignalTimestamp { get; set; }
        public string PredictedCategory { get; set; } = string.Empty;
        public string ActualCategory { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public bool IsCorrect { get; set; }
        public string UserId { get; set; } = string.Empty;
        public DateTime RecordedAt { get; set; }
        public Dictionary<string, object> AdditionalMetadata { get; set; } = new();
    }

    public class TeamLearningData
    {
        public string TeamName { get; set; } = string.Empty;
        public List<CategorizationFeedback> FeedbackHistory { get; set; } = new();
        public List<ImprovementSuggestion> ImprovementSuggestions { get; set; } = new();
        public List<PatternHistory> PatternHistory { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class NewTeamLearningResult
    {
        public string TeamName { get; set; } = string.Empty;
        public int AnalyzedSignalCount { get; set; }
        public List<CategoryConfiguration> SuggestedCategories { get; set; } = new();
        public List<DataSourceConfiguration> SuggestedDataSources { get; set; } = new();
        public List<SimilarTeam> SimilarTeams { get; set; } = new();
        public double ConfidenceScore { get; set; }
        public DateTime LearningTimestamp { get; set; }
    }

    public class TeamLearningInsights
    {
        public string TeamName { get; set; } = string.Empty;
        public int TotalFeedbackRecords { get; set; }
        public double AccuracyRate { get; set; }
        public Dictionary<string, double> CategoryAccuracy { get; set; } = new();
        public List<MisclassificationPattern> CommonMisclassifications { get; set; } = new();
        public List<ImprovementSuggestion> SuggestedImprovements { get; set; } = new();
        public List<PatternTrend> PatternTrends { get; set; } = new();
        public DateTime LastUpdated { get; set; }
    }

    public class MLTrainingDataset
    {
        public DateTime GeneratedAt { get; set; }
        public List<string> Teams { get; set; } = new();
        public DateTime FromDate { get; set; }
        public List<MLTrainingExample> TrainingExamples { get; set; } = new();
        public Dictionary<string, int> CategoryDistribution { get; set; } = new();
        public Dictionary<string, int> TeamDistribution { get; set; } = new();
    }

    public class MLTrainingExample
    {
        public string Id { get; set; } = string.Empty;
        public string InputText { get; set; } = string.Empty;
        public string TrueCategory { get; set; } = string.Empty;
        public string PredictedCategory { get; set; } = string.Empty;
        public string TeamContext { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool WasCorrect { get; set; }
        public double ConfidenceScore { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class KeywordSuggestion
    {
        public string CategoryName { get; set; } = string.Empty;
        public List<string> SuggestedKeywords { get; set; } = new();
        public double Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
        public List<string> SampleSignals { get; set; } = new();
    }

    public class MisclassificationPattern
    {
        public string PredictedCategory { get; set; } = string.Empty;
        public string ActualCategory { get; set; } = string.Empty;
        public int Count { get; set; }
        public List<string> ExampleSignals { get; set; } = new();
    }

    public class ImprovementSuggestion
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CategoryAffected { get; set; } = string.Empty;
        public DateTime SuggestedAt { get; set; }
    }

    public class PatternHistory
    {
        public string Pattern { get; set; } = string.Empty;
        public DateTime RecordedAt { get; set; }
        public double Effectiveness { get; set; }
    }

    public class PatternTrend
    {
        public string Pattern { get; set; } = string.Empty;
        public List<double> EffectivenessHistory { get; set; } = new();
        public string Trend { get; set; } = string.Empty; // "improving", "declining", "stable"
    }

    public class SimilarTeam
    {
        public string TeamName { get; set; } = string.Empty;
        public double SimilarityScore { get; set; }
        public List<string> CommonPatterns { get; set; } = new();
    }
}
