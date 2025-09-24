using System;
using System.Collections.Generic;
using SIREN.Core.Interfaces;

namespace SIREN.Core.Models
{
    // Supporting data classes for Pattern Learning

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
