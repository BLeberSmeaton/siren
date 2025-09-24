using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using System.Text.Json;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Service that provides a bridge between traditional pattern recognition and ML models.
    /// This service handles the transition and hybrid operation between rule-based and ML approaches.
    /// </summary>
    public class MLIntegrationService : ICategorizer
    {
        private readonly IConfigurationService _configurationService;
        private readonly EnhancedPatternRecognitionEngine _traditionalEngine;
        private readonly IMLPatternRecognitionService? _mlService;
        private readonly IPatternLearningService _learningService;
        private readonly string _teamName;
        private readonly MLIntegrationOptions _options;

        public MLIntegrationService(
            IConfigurationService configurationService,
            IPatternLearningService learningService,
            string teamName,
            IMLPatternRecognitionService? mlService = null,
            MLIntegrationOptions? options = null)
        {
            _configurationService = configurationService;
            _learningService = learningService;
            _teamName = teamName;
            _mlService = mlService;
            _options = options ?? new MLIntegrationOptions();
            _traditionalEngine = new EnhancedPatternRecognitionEngine(configurationService, teamName);
        }

        /// <summary>
        /// Categorize using hybrid approach: ML when available and confident, traditional otherwise
        /// </summary>
        public async Task<string?> CategorizeSignalAsync(SupportSignal signal)
        {
            var result = await CategorizeSignalWithDetailsAsync(signal);
            return result?.FinalResult?.PredictedCategory;
        }

        /// <summary>
        /// Categorize with detailed results showing both traditional and ML approaches
        /// </summary>
        public async Task<HybridCategorizationResult> CategorizeSignalWithDetailsAsync(SupportSignal signal)
        {
            var result = new HybridCategorizationResult
            {
                SignalId = signal.Id,
                ProcessedAt = DateTime.UtcNow
            };

            try
            {
                // Always get traditional categorization as baseline
                var traditionalCategory = await _traditionalEngine.CategorizeSignalAsync(signal);
                result.TraditionalResult = new CategorizationResult
                {
                    PredictedCategory = traditionalCategory,
                    Method = "EnhancedPatternRecognition",
                    Confidence = 0.7 // Default confidence for traditional approach
                };

                // Try ML categorization if service is available
                if (_mlService != null)
                {
                    try
                    {
                        var mlResult = await _mlService.CategorizeWithMLAsync(signal, _teamName);
                        result.MLResult = new CategorizationResult
                        {
                            PredictedCategory = mlResult.PredictedCategory,
                            Method = "MachineLearning",
                            Confidence = mlResult.Confidence,
                            CategoryProbabilities = mlResult.CategoryProbabilities,
                            ExplanationText = mlResult.ExplanationText
                        };
                    }
                    catch (Exception ex)
                    {
                        result.MLError = ex.Message;
                    }
                }

                // Determine final prediction using hybrid strategy
                result.FinalResult = await DetermineHybridResult(result, signal);
                
                // Record the prediction for learning
                await RecordPredictionForLearning(signal, result);

                return result;
            }
            catch (Exception ex)
            {
                result.Error = ex.Message;
                result.FinalResult = new CategorizationResult
                {
                    PredictedCategory = null,
                    Method = "Error",
                    Confidence = 0.0
                };
                return result;
            }
        }

        /// <summary>
        /// Record user feedback to improve both traditional and ML models
        /// </summary>
        public async Task RecordFeedbackAsync(
            SupportSignal signal,
            string predictedCategory,
            string actualCategory,
            double confidence,
            string userId = "system")
        {
            // Record feedback for pattern learning service
            await _learningService.RecordCategorizationFeedbackAsync(
                _teamName, signal, predictedCategory, actualCategory, confidence, userId);

            // If ML service is available, update it with online learning
            if (_mlService != null)
            {
                var feedback = new CategorizationFeedback
                {
                    Id = Guid.NewGuid().ToString(),
                    TeamName = _teamName,
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

                var interfaceFeedback = new Interfaces.CategorizationFeedback
                {
                    Id = feedback.Id,
                    TeamName = feedback.TeamName,
                    SignalId = feedback.SignalId,
                    SignalTitle = feedback.SignalTitle,
                    SignalDescription = feedback.SignalDescription,
                    SignalSource = feedback.SignalSource,
                    SignalTimestamp = feedback.SignalTimestamp,
                    PredictedCategory = feedback.PredictedCategory,
                    ActualCategory = feedback.ActualCategory,
                    ConfidenceScore = feedback.ConfidenceScore,
                    IsCorrect = feedback.IsCorrect,
                    UserId = feedback.UserId,
                    RecordedAt = feedback.RecordedAt,
                    AdditionalMetadata = feedback.AdditionalMetadata ?? new Dictionary<string, object>()
                };
                await _mlService.UpdateModelWithFeedbackAsync(_teamName, interfaceFeedback);
            }
        }

        /// <summary>
        /// Analyze team readiness for ML integration
        /// </summary>
        public async Task<MLReadinessAssessment> AssessMLReadinessAsync()
        {
            var insights = await _learningService.GetTeamLearningInsightsAsync(_teamName);
            var assessment = new MLReadinessAssessment
            {
                TeamName = _teamName,
                AssessedAt = DateTime.UtcNow
            };

            // Check data volume
            assessment.HasSufficientData = insights.TotalFeedbackRecords >= _options.MinTrainingExamples;
            assessment.DataVolumeScore = Math.Min(1.0, (double)insights.TotalFeedbackRecords / _options.OptimalTrainingExamples);

            // Check data quality
            assessment.DataQualityScore = insights.AccuracyRate;
            assessment.HasQualityData = insights.AccuracyRate >= _options.MinDataQuality;

            // Check category distribution
            var categoryBalance = CalculateCategoryBalance(insights.CategoryAccuracy);
            assessment.CategoryBalanceScore = categoryBalance;
            assessment.HasBalancedCategories = categoryBalance >= _options.MinCategoryBalance;

            // Overall readiness
            assessment.OverallReadiness = (assessment.DataVolumeScore * 0.4) +
                                        (assessment.DataQualityScore * 0.3) +
                                        (assessment.CategoryBalanceScore * 0.3);
            assessment.IsReadyForML = assessment.OverallReadiness >= _options.MLReadinessThreshold;

            // Generate recommendations
            assessment.Recommendations = GenerateMLRecommendations(assessment, insights);

            return assessment;
        }

        /// <summary>
        /// Generate training data for ML model development
        /// </summary>
        public async Task<MLTrainingDataset> GenerateTrainingDatasetAsync(DateTime? fromDate = null)
        {
            return await _learningService.GenerateMLTrainingDatasetAsync(
                new List<string> { _teamName }, 
                fromDate);
        }

        /// <summary>
        /// Initialize ML model for the team if ready
        /// </summary>
        public async Task<MLInitializationResult> InitializeMLModelAsync()
        {
            var readiness = await AssessMLReadinessAsync();
            
            if (!readiness.IsReadyForML)
            {
                return new MLInitializationResult
                {
                    IsSuccessful = false,
                    Message = "Team is not ready for ML integration",
                    Recommendations = readiness.Recommendations
                };
            }

            if (_mlService == null)
            {
                return new MLInitializationResult
                {
                    IsSuccessful = false,
                    Message = "ML service is not available"
                };
            }

            try
            {
                var dataset = await GenerateTrainingDatasetAsync();
                var trainingOptions = new MLTrainingOptions
                {
                    MaxEpochs = _options.DefaultTrainingEpochs,
                    BatchSize = _options.DefaultBatchSize,
                    ValidationSplit = 0.2,
                    UseTransferLearning = true
                };

                // Convert training examples to interface type
                var interfaceTrainingExamples = dataset.TrainingExamples.Select(e => new Interfaces.MLTrainingExample
                {
                    Id = e.Id,
                    InputText = e.InputText,
                    TrueCategory = e.TrueCategory,
                    PredictedCategory = e.PredictedCategory,
                    TeamContext = e.TeamContext,
                    Source = e.Source,
                    Timestamp = e.Timestamp,
                    WasCorrect = e.WasCorrect,
                    ConfidenceScore = e.ConfidenceScore,
                    Metadata = e.Metadata
                }).ToList();

                var trainingResult = await _mlService.TrainTeamModelAsync(
                    _teamName, 
                    interfaceTrainingExamples, 
                    trainingOptions);

                return new MLInitializationResult
                {
                    IsSuccessful = trainingResult.IsSuccessful,
                    Message = trainingResult.IsSuccessful 
                        ? "ML model trained successfully" 
                        : trainingResult.ErrorMessage,
                    ModelVersion = trainingResult.ModelVersion,
                    TrainingAccuracy = trainingResult.FinalAccuracy
                };
            }
            catch (Exception ex)
            {
                return new MLInitializationResult
                {
                    IsSuccessful = false,
                    Message = $"Failed to initialize ML model: {ex.Message}"
                };
            }
        }

        public string? CategorizeSignal(SupportSignal signal)
        {
            return CategorizeSignalAsync(signal).GetAwaiter().GetResult();
        }

        #region Private Helper Methods

        private Task<CategorizationResult> DetermineHybridResult(
            HybridCategorizationResult hybridResult, 
            SupportSignal signal)
        {
            // Strategy 1: ML confidence threshold
            if (hybridResult.MLResult != null && 
                hybridResult.MLResult.Confidence >= _options.MLConfidenceThreshold)
            {
                return Task.FromResult(new CategorizationResult
                {
                    PredictedCategory = hybridResult.MLResult.PredictedCategory,
                    Method = "ML-Primary",
                    Confidence = hybridResult.MLResult.Confidence,
                    CategoryProbabilities = hybridResult.MLResult.CategoryProbabilities,
                    ExplanationText = $"ML model confident prediction: {hybridResult.MLResult.ExplanationText}"
                });
            }

            // Strategy 2: Agreement between ML and traditional (only if ML confidence is reasonable)
            if (hybridResult.MLResult != null && 
                hybridResult.MLResult.Confidence >= 0.6 && // Add minimum confidence for agreement
                hybridResult.TraditionalResult?.PredictedCategory == hybridResult.MLResult.PredictedCategory)
            {
                var combinedConfidence = (hybridResult.MLResult.Confidence + (hybridResult.TraditionalResult?.Confidence ?? 0.5)) / 2;
                return Task.FromResult(new CategorizationResult
                {
                    PredictedCategory = hybridResult.MLResult.PredictedCategory,
                    Method = "Hybrid-Agreement",
                    Confidence = Math.Min(combinedConfidence + 0.1, 1.0), // Boost for agreement
                    ExplanationText = "Both ML and traditional methods agree"
                });
            }

            // Strategy 3: Fallback to traditional
            return Task.FromResult(new CategorizationResult
            {
                PredictedCategory = hybridResult.TraditionalResult?.PredictedCategory,
                Method = "Traditional-Fallback",
                Confidence = hybridResult.TraditionalResult?.Confidence ?? 0.5,
                ExplanationText = hybridResult.MLResult == null 
                    ? "ML not available, using traditional method"
                    : "ML confidence low, using traditional method"
            });
        }

        private Task RecordPredictionForLearning(SupportSignal signal, HybridCategorizationResult result)
        {
            // This will be used for future training data
            var predictionRecord = new PredictionRecord
            {
                SignalId = signal.Id,
                TeamName = _teamName,
                TraditionalPrediction = result.TraditionalResult?.PredictedCategory,
                MLPrediction = result.MLResult?.PredictedCategory,
                FinalPrediction = result.FinalResult?.PredictedCategory,
                PredictedAt = DateTime.UtcNow
            };

            // TODO: Store prediction record for analysis
            return Task.CompletedTask;
        }

        private double CalculateCategoryBalance(Dictionary<string, double> categoryAccuracy)
        {
            if (!categoryAccuracy.Any()) return 0.0;

            var values = categoryAccuracy.Values.ToList();
            var mean = values.Average();
            var variance = values.Select(v => Math.Pow(v - mean, 2)).Average();
            var stdDev = Math.Sqrt(variance);

            // Lower standard deviation = better balance
            // Normalize to 0-1 scale
            return Math.Max(0.0, 1.0 - (stdDev / mean));
        }

        private List<string> GenerateMLRecommendations(
            MLReadinessAssessment assessment, 
            TeamLearningInsights insights)
        {
            var recommendations = new List<string>();

            if (!assessment.HasSufficientData)
            {
                recommendations.Add($"Collect more training data. Current: {insights.TotalFeedbackRecords}, Need: {_options.MinTrainingExamples}");
            }

            if (!assessment.HasQualityData)
            {
                recommendations.Add($"Improve data quality. Current accuracy: {insights.AccuracyRate:P}, Need: {_options.MinDataQuality:P}");
            }

            if (!assessment.HasBalancedCategories)
            {
                recommendations.Add("Balance category distribution - some categories may be underrepresented");
            }

            if (insights.CommonMisclassifications.Any())
            {
                recommendations.Add("Address common misclassification patterns before ML training");
            }

            return recommendations;
        }

        private static DateTime ParseTimestamp(string timestamp)
        {
            return DateTime.TryParse(timestamp, out var result) ? result : DateTime.UtcNow;
        }

        #endregion
    }

    #region Supporting Classes

    public class MLIntegrationOptions
    {
        public double MLConfidenceThreshold { get; set; } = 0.8;
        public int MinTrainingExamples { get; set; } = 100;
        public int OptimalTrainingExamples { get; set; } = 500;
        public double MinDataQuality { get; set; } = 0.7;
        public double MinCategoryBalance { get; set; } = 0.6;
        public double MLReadinessThreshold { get; set; } = 0.7;
        public int DefaultTrainingEpochs { get; set; } = 50;
        public int DefaultBatchSize { get; set; } = 16;
    }

    public class HybridCategorizationResult
    {
        public string SignalId { get; set; } = string.Empty;
        public CategorizationResult? TraditionalResult { get; set; }
        public CategorizationResult? MLResult { get; set; }
        public CategorizationResult? FinalResult { get; set; }
        public DateTime ProcessedAt { get; set; }
        public string? MLError { get; set; }
        public string? Error { get; set; }
    }

    public class CategorizationResult
    {
        public string? PredictedCategory { get; set; }
        public string Method { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public Dictionary<string, double> CategoryProbabilities { get; set; } = new();
        public string ExplanationText { get; set; } = string.Empty;
    }

    public class MLReadinessAssessment
    {
        public string TeamName { get; set; } = string.Empty;
        public DateTime AssessedAt { get; set; }
        public bool HasSufficientData { get; set; }
        public bool HasQualityData { get; set; }
        public bool HasBalancedCategories { get; set; }
        public bool IsReadyForML { get; set; }
        public double DataVolumeScore { get; set; }
        public double DataQualityScore { get; set; }
        public double CategoryBalanceScore { get; set; }
        public double OverallReadiness { get; set; }
        public List<string> Recommendations { get; set; } = new();
    }

    public class MLInitializationResult
    {
        public bool IsSuccessful { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ModelVersion { get; set; }
        public double? TrainingAccuracy { get; set; }
        public List<string> Recommendations { get; set; } = new();
    }

    public class PredictionRecord
    {
        public string SignalId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public string? TraditionalPrediction { get; set; }
        public string? MLPrediction { get; set; }
        public string? FinalPrediction { get; set; }
        public DateTime PredictedAt { get; set; }
    }

    #endregion
}
