using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Interface for pattern learning service that adapts categorization patterns based on user feedback
    /// </summary>
    public interface IPatternLearningService
    {
        /// <summary>
        /// Record user feedback on automatic categorization
        /// </summary>
        Task RecordCategorizationFeedbackAsync(
            string teamName, 
            SupportSignal signal, 
            string predictedCategory, 
            string actualCategory, 
            double confidence,
            string userId = "system");

        /// <summary>
        /// Learn patterns from new team's sample data
        /// </summary>
        Task<NewTeamLearningResult> LearnPatternsFromSampleDataAsync(
            string proposedTeamName,
            List<SupportSignal> sampleSignals,
            List<string> existingTeamNames);

        /// <summary>
        /// Get learning insights for a specific team
        /// </summary>
        Task<TeamLearningInsights> GetTeamLearningInsightsAsync(string teamName);

        /// <summary>
        /// Suggest keyword improvements for existing categories
        /// </summary>
        Task<List<KeywordSuggestion>> SuggestKeywordImprovementsAsync(string teamName);

        /// <summary>
        /// Generate ML training data from learning history
        /// </summary>
        Task<MLTrainingDataset> GenerateMLTrainingDatasetAsync(
            List<string> teamNames, 
            DateTime? fromDate = null);
    }
}
