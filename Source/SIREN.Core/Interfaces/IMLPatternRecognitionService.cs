using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Interface for machine learning-powered pattern recognition services.
    /// This interface defines the contract for future ML integrations.
    /// </summary>
    public interface IMLPatternRecognitionService
    {
        /// <summary>
        /// Categorize a support signal using ML models with confidence scoring
        /// </summary>
        Task<MLCategorizationResult> CategorizeWithMLAsync(
            SupportSignal signal, 
            string teamName, 
            MLModelContext? context = null);

        /// <summary>
        /// Train or retrain ML models for a specific team using feedback data
        /// </summary>
        Task<MLTrainingResult> TrainTeamModelAsync(
            string teamName,
            List<MLTrainingExample> trainingData,
            MLTrainingOptions? options = null);

        /// <summary>
        /// Predict category probabilities for all possible categories
        /// </summary>
        Task<Dictionary<string, double>> PredictCategoryProbabilitiesAsync(
            SupportSignal signal,
            string teamName);

        /// <summary>
        /// Extract semantic features from text for similarity analysis
        /// </summary>
        Task<MLFeatureVector> ExtractFeaturesAsync(
            string text,
            MLFeatureExtractionOptions? options = null);

        /// <summary>
        /// Find similar signals using semantic similarity
        /// </summary>
        Task<List<SimilarSignal>> FindSimilarSignalsAsync(
            SupportSignal signal,
            string teamName,
            int maxResults = 10,
            double minimumSimilarity = 0.7);

        /// <summary>
        /// Analyze patterns in signals to suggest new categories
        /// </summary>
        Task<List<MLCategorySuggestion>> AnalyzePatternsForNewCategoriesAsync(
            List<SupportSignal> signals,
            string teamName,
            int maxSuggestions = 5);

        /// <summary>
        /// Generate embeddings for a batch of signals for clustering
        /// </summary>
        Task<Dictionary<string, MLFeatureVector>> GenerateSignalEmbeddingsAsync(
            List<SupportSignal> signals);

        /// <summary>
        /// Evaluate model performance on test data
        /// </summary>
        Task<MLModelPerformance> EvaluateModelAsync(
            string teamName,
            List<MLTestCase> testCases);

        /// <summary>
        /// Get model information and statistics
        /// </summary>
        Task<MLModelInfo> GetModelInfoAsync(string teamName);

        /// <summary>
        /// Update model with new feedback in an online learning fashion
        /// </summary>
        Task UpdateModelWithFeedbackAsync(
            string teamName,
            CategorizationFeedback feedback);
    }

    /// <summary>
    /// Context information for ML model inference
    /// </summary>
    public class MLModelContext
    {
        public DateTime RequestTime { get; set; } = DateTime.UtcNow;
        public string UserId { get; set; } = string.Empty;
        public Dictionary<string, object> AdditionalContext { get; set; } = new();
        public bool ExplainResults { get; set; } = false;
        public double ConfidenceThreshold { get; set; } = 0.5;
    }

    /// <summary>
    /// Result of ML-based categorization
    /// </summary>
    public class MLCategorizationResult
    {
        public string PredictedCategory { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public Dictionary<string, double> CategoryProbabilities { get; set; } = new();
        public List<string> ReasoningFeatures { get; set; } = new();
        public MLFeatureVector FeatureVector { get; set; } = new();
        public DateTime PredictedAt { get; set; } = DateTime.UtcNow;
        public string ModelVersion { get; set; } = string.Empty;
        public bool IsAboveThreshold { get; set; }
        public string ExplanationText { get; set; } = string.Empty;
    }

    /// <summary>
    /// Training example for ML model
    /// </summary>
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

    /// <summary>
    /// Options for ML model training
    /// </summary>
    public class MLTrainingOptions
    {
        public int MaxEpochs { get; set; } = 100;
        public double LearningRate { get; set; } = 0.001;
        public int BatchSize { get; set; } = 32;
        public double ValidationSplit { get; set; } = 0.2;
        public bool UseTransferLearning { get; set; } = true;
        public string BaseModelType { get; set; } = "bert-base-uncased";
        public Dictionary<string, object> ModelHyperparameters { get; set; } = new();
        public bool SaveCheckpoints { get; set; } = true;
        public string OutputModelPath { get; set; } = string.Empty;
    }

    /// <summary>
    /// Result of ML model training
    /// </summary>
    public class MLTrainingResult
    {
        public string ModelVersion { get; set; } = string.Empty;
        public DateTime TrainingStarted { get; set; }
        public DateTime TrainingCompleted { get; set; }
        public TimeSpan TrainingDuration => TrainingCompleted - TrainingStarted;
        public int TotalExamples { get; set; }
        public int ValidationExamples { get; set; }
        public double FinalAccuracy { get; set; }
        public double FinalLoss { get; set; }
        public Dictionary<string, double> CategoryMetrics { get; set; } = new();
        public List<string> TrainingLogs { get; set; } = new();
        public string ModelPath { get; set; } = string.Empty;
        public bool IsSuccessful { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }

    /// <summary>
    /// Feature vector representation for ML operations
    /// </summary>
    public class MLFeatureVector
    {
        public float[] Values { get; set; } = Array.Empty<float>();
        public int Dimensions => Values.Length;
        public Dictionary<string, object> FeatureMetadata { get; set; } = new();
        public string ExtractionMethod { get; set; } = string.Empty;
        public DateTime ExtractedAt { get; set; } = DateTime.UtcNow;

        public double CosineSimilarity(MLFeatureVector other)
        {
            if (Dimensions != other.Dimensions) return 0.0;

            var dotProduct = 0.0;
            var normA = 0.0;
            var normB = 0.0;

            for (int i = 0; i < Dimensions; i++)
            {
                dotProduct += Values[i] * other.Values[i];
                normA += Values[i] * Values[i];
                normB += other.Values[i] * other.Values[i];
            }

            if (normA == 0.0 || normB == 0.0) return 0.0;

            return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }

    /// <summary>
    /// Options for feature extraction
    /// </summary>
    public class MLFeatureExtractionOptions
    {
        public string Method { get; set; } = "transformer"; // transformer, tfidf, word2vec
        public int MaxTokens { get; set; } = 512;
        public bool IncludePositional { get; set; } = true;
        public bool NormalizeVectors { get; set; } = true;
        public Dictionary<string, object> ModelParameters { get; set; } = new();
    }

    /// <summary>
    /// Similar signal result from semantic search
    /// </summary>
    public class SimilarSignal
    {
        public SupportSignal Signal { get; set; } = new();
        public double SimilarityScore { get; set; }
        public string SimilarityReason { get; set; } = string.Empty;
        public List<string> MatchingFeatures { get; set; } = new();
    }

    /// <summary>
    /// ML-based category suggestion
    /// </summary>
    public class MLCategorySuggestion
    {
        public string SuggestedCategoryName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> RepresentativeKeywords { get; set; } = new();
        public List<SupportSignal> ExampleSignals { get; set; } = new();
        public double Confidence { get; set; }
        public int ClusterSize { get; set; }
        public MLFeatureVector CentroidVector { get; set; } = new();
        public string ModelReasoning { get; set; } = string.Empty;
    }

    /// <summary>
    /// Test case for model evaluation
    /// </summary>
    public class MLTestCase
    {
        public SupportSignal Signal { get; set; } = new();
        public string ExpectedCategory { get; set; } = string.Empty;
        public Dictionary<string, object> TestMetadata { get; set; } = new();
    }

    /// <summary>
    /// ML model performance metrics
    /// </summary>
    public class MLModelPerformance
    {
        public double OverallAccuracy { get; set; }
        public double OverallPrecision { get; set; }
        public double OverallRecall { get; set; }
        public double OverallF1Score { get; set; }
        public Dictionary<string, CategoryPerformance> CategoryMetrics { get; set; } = new();
        public ConfusionMatrix ConfusionMatrix { get; set; } = new();
        public DateTime EvaluatedAt { get; set; } = DateTime.UtcNow;
        public int TestCaseCount { get; set; }
        public string ModelVersion { get; set; } = string.Empty;
    }

    /// <summary>
    /// Performance metrics for individual categories
    /// </summary>
    public class CategoryPerformance
    {
        public string CategoryName { get; set; } = string.Empty;
        public double Precision { get; set; }
        public double Recall { get; set; }
        public double F1Score { get; set; }
        public int TruePositives { get; set; }
        public int FalsePositives { get; set; }
        public int FalseNegatives { get; set; }
        public int Support { get; set; } // Total instances in test set
    }

    /// <summary>
    /// Confusion matrix for multi-class classification
    /// </summary>
    public class ConfusionMatrix
    {
        public List<string> CategoryLabels { get; set; } = new();
        public int[,] Matrix { get; set; } = new int[0, 0];
        
        public int GetValue(string trueCategory, string predictedCategory)
        {
            var trueIndex = CategoryLabels.IndexOf(trueCategory);
            var predIndex = CategoryLabels.IndexOf(predictedCategory);
            
            if (trueIndex == -1 || predIndex == -1) return 0;
            
            return Matrix[trueIndex, predIndex];
        }
    }

    /// <summary>
    /// Information about a trained ML model
    /// </summary>
    public class MLModelInfo
    {
        public string TeamName { get; set; } = string.Empty;
        public string ModelVersion { get; set; } = string.Empty;
        public string ModelType { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; }
        public int TrainingExampleCount { get; set; }
        public List<string> SupportedCategories { get; set; } = new();
        public Dictionary<string, object> ModelParameters { get; set; } = new();
        public MLModelPerformance LatestPerformance { get; set; } = new();
        public long ModelSizeBytes { get; set; }
        public string ModelPath { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int PredictionCount { get; set; }
        public double AverageInferenceTimeMs { get; set; }
    }

    /// <summary>
    /// Feedback data structure for pattern learning
    /// </summary>
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
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> AdditionalMetadata { get; set; } = new();
    }
}
