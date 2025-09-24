using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using SIREN.Core.Services;
using Moq;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class MLIntegrationServiceTests
    {
        private readonly Mock<IConfigurationService> _mockConfigService;
        private readonly Mock<IMLPatternRecognitionService> _mockMLService;
        private readonly Mock<PatternLearningService> _mockLearningService;
        private readonly MLIntegrationService _service;
        private readonly List<CategoryConfiguration> _sampleCategories;

        public MLIntegrationServiceTests()
        {
            _mockConfigService = new Mock<IConfigurationService>();
            _mockMLService = new Mock<IMLPatternRecognitionService>();
            _mockLearningService = new Mock<PatternLearningService>(_mockConfigService.Object, It.IsAny<string>());
            
            _sampleCategories = new List<CategoryConfiguration>
            {
                new CategoryConfiguration
                {
                    Name = "API",
                    Keywords = new List<string> { "API", "endpoint" },
                    Priority = 2,
                    IsActive = true
                },
                new CategoryConfiguration
                {
                    Name = "Certificate",
                    Keywords = new List<string> { "certificate", "TLS" },
                    Priority = 1,
                    IsActive = true
                }
            };

            _mockConfigService.Setup(x => x.GetActiveCategoriesAsync("test-team"))
                .ReturnsAsync(_sampleCategories);

            _service = new MLIntegrationService(
                _mockConfigService.Object,
                _mockLearningService.Object,
                "test-team",
                _mockMLService.Object);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithMLServiceUnavailable_UsesFallbackTraditionalMethod()
        {
            // Arrange
            var serviceWithoutML = new MLIntegrationService(
                _mockConfigService.Object,
                _mockLearningService.Object,
                "test-team",
                mlService: null); // No ML service

            var signal = new SupportSignal
            {
                Id = "test-1",
                Title = "Certificate expiry issue",
                Description = "TLS certificate needs renewal",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await serviceWithoutML.CategorizeSignalAsync(signal);

            // Assert
            Assert.Equal("Certificate", result); // Should use traditional categorization
        }

        [Fact]
        public async Task CategorizeSignalWithDetailsAsync_WithHighMLConfidence_ReturnsMLResult()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "ml-confident",
                Title = "API endpoint failure",
                Description = "High confidence ML prediction test",
                Timestamp = DateTime.UtcNow
            };

            var mlResult = new MLCategorizationResult
            {
                PredictedCategory = "API",
                Confidence = 0.9, // High confidence
                ExplanationText = "Strong API indicators detected",
                CategoryProbabilities = new Dictionary<string, double> { { "API", 0.9 }, { "Certificate", 0.1 } }
            };

            _mockMLService.Setup(x => x.CategorizeWithMLAsync(signal, "test-team", It.IsAny<MLModelContext>()))
                .ReturnsAsync(mlResult);

            // Act
            var result = await _service.CategorizeSignalWithDetailsAsync(signal);

            // Assert
            Assert.Equal("ML-Primary", result.FinalResult?.Method);
            Assert.Equal("API", result.FinalResult?.PredictedCategory);
            Assert.Equal(0.9, result.FinalResult?.Confidence);
        }

        [Fact]
        public async Task CategorizeSignalWithDetailsAsync_WithLowMLConfidence_FallsBackToTraditional()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "ml-uncertain",
                Title = "Certificate issue maybe",
                Description = "Low confidence prediction test",
                Timestamp = DateTime.UtcNow
            };

            var mlResult = new MLCategorizationResult
            {
                PredictedCategory = "Unknown",
                Confidence = 0.3, // Low confidence
                ExplanationText = "Uncertain prediction"
            };

            _mockMLService.Setup(x => x.CategorizeWithMLAsync(signal, "test-team", It.IsAny<MLModelContext>()))
                .ReturnsAsync(mlResult);

            // Act
            var result = await _service.CategorizeSignalWithDetailsAsync(signal);

            // Assert
            Assert.Equal("Traditional-Fallback", result.FinalResult?.Method);
            Assert.Equal("Certificate", result.FinalResult?.PredictedCategory); // Traditional should pick Certificate
        }

        [Fact]
        public async Task CategorizeSignalWithDetailsAsync_WithMLTraditionalAgreement_CombinesConfidence()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "agreement-test",
                Title = "Certificate expiry alert",
                Description = "TLS certificate renewal required",
                Timestamp = DateTime.UtcNow
            };

            var mlResult = new MLCategorizationResult
            {
                PredictedCategory = "Certificate",
                Confidence = 0.7,
                ExplanationText = "Certificate indicators found"
            };

            _mockMLService.Setup(x => x.CategorizeWithMLAsync(signal, "test-team", It.IsAny<MLModelContext>()))
                .ReturnsAsync(mlResult);

            // Act
            var result = await _service.CategorizeSignalWithDetailsAsync(signal);

            // Assert
            Assert.Equal("Hybrid-Agreement", result.FinalResult?.Method);
            Assert.Equal("Certificate", result.FinalResult?.PredictedCategory);
            Assert.True(result.FinalResult?.Confidence > 0.7); // Should be boosted for agreement
            Assert.Contains("Both ML and traditional methods agree", result.FinalResult?.ExplanationText);
        }

        [Fact]
        public async Task RecordFeedbackAsync_CallsBothLearningServiceAndMLService()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "feedback-test",
                Title = "API issue",
                Description = "Endpoint timeout",
                Timestamp = DateTime.UtcNow
            };

            // Act
            await _service.RecordFeedbackAsync(signal, "API", "Certificate", 0.6, "test-user");

            // Assert
            _mockLearningService.Verify(x => x.RecordCategorizationFeedbackAsync(
                "test-team", signal, "API", "Certificate", 0.6, "test-user"), Times.Once);

            _mockMLService.Verify(x => x.UpdateModelWithFeedbackAsync(
                "test-team", It.IsAny<SIREN.Core.Interfaces.CategorizationFeedback>()), Times.Once);
        }

        [Fact]
        public async Task AssessMLReadinessAsync_WithSufficientData_ReturnsReadyStatus()
        {
            // Arrange
            var mockInsights = new TeamLearningInsights
            {
                TeamName = "test-team",
                TotalFeedbackRecords = 150, // Above minimum threshold
                AccuracyRate = 0.8, // Good accuracy
                CategoryAccuracy = new Dictionary<string, double>
                {
                    { "API", 0.9 },
                    { "Certificate", 0.8 },
                    { "Database", 0.7 }
                }
            };

            _mockLearningService.Setup(x => x.GetTeamLearningInsightsAsync("test-team"))
                .ReturnsAsync(mockInsights);

            // Act
            var assessment = await _service.AssessMLReadinessAsync();

            // Assert
            Assert.True(assessment.HasSufficientData);
            Assert.True(assessment.HasQualityData);
            Assert.True(assessment.IsReadyForML);
            Assert.True(assessment.OverallReadiness >= 0.7);
            Assert.Empty(assessment.Recommendations); // No recommendations needed when ready
        }

        [Fact]
        public async Task AssessMLReadinessAsync_WithInsufficientData_ReturnsNotReadyWithRecommendations()
        {
            // Arrange
            var mockInsights = new TeamLearningInsights
            {
                TeamName = "test-team",
                TotalFeedbackRecords = 50, // Below minimum threshold (100)
                AccuracyRate = 0.6, // Below quality threshold (0.7)
                CategoryAccuracy = new Dictionary<string, double>
                {
                    { "API", 0.9 },
                    { "Certificate", 0.3 } // Unbalanced
                }
            };

            _mockLearningService.Setup(x => x.GetTeamLearningInsightsAsync("test-team"))
                .ReturnsAsync(mockInsights);

            // Act
            var assessment = await _service.AssessMLReadinessAsync();

            // Assert
            Assert.False(assessment.HasSufficientData);
            Assert.False(assessment.HasQualityData);
            Assert.False(assessment.IsReadyForML);
            Assert.NotEmpty(assessment.Recommendations);
            Assert.Contains(assessment.Recommendations, r => r.Contains("Collect more training data"));
            Assert.Contains(assessment.Recommendations, r => r.Contains("Improve data quality"));
        }

        [Fact]
        public async Task InitializeMLModelAsync_WhenNotReady_ReturnsFailureResult()
        {
            // Arrange
            var mockInsights = new TeamLearningInsights
            {
                TeamName = "test-team",
                TotalFeedbackRecords = 10, // Too few records
                AccuracyRate = 0.5 // Poor accuracy
            };

            _mockLearningService.Setup(x => x.GetTeamLearningInsightsAsync("test-team"))
                .ReturnsAsync(mockInsights);

            // Act
            var result = await _service.InitializeMLModelAsync();

            // Assert
            Assert.False(result.IsSuccessful);
            Assert.Contains("not ready for ML integration", result.Message);
            Assert.NotEmpty(result.Recommendations);
        }

        [Fact]
        public async Task InitializeMLModelAsync_WhenReady_AttemptsTraining()
        {
            // Arrange
            var mockInsights = new TeamLearningInsights
            {
                TeamName = "test-team", 
                TotalFeedbackRecords = 200,
                AccuracyRate = 0.8,
                CategoryAccuracy = new Dictionary<string, double> { { "API", 0.8 }, { "Certificate", 0.8 } }
            };

            var mockDataset = new SIREN.Core.Services.MLTrainingDataset
            {
                TrainingExamples = new List<SIREN.Core.Services.MLTrainingExample>
                {
                    new SIREN.Core.Services.MLTrainingExample 
                    { 
                        Id = "1",
                        InputText = "API issue", 
                        TrueCategory = "API",
                        TeamContext = "test-team",
                        Metadata = new Dictionary<string, object>()
                    }
                }
            };

            var mockTrainingResult = new MLTrainingResult
            {
                IsSuccessful = true,
                ModelVersion = "v1.0",
                FinalAccuracy = 0.85
            };

            _mockLearningService.Setup(x => x.GetTeamLearningInsightsAsync("test-team"))
                .ReturnsAsync(mockInsights);
            _mockLearningService.Setup(x => x.GenerateMLTrainingDatasetAsync(It.IsAny<List<string>>(), It.IsAny<DateTime?>()))
                .ReturnsAsync(mockDataset);
            _mockMLService.Setup(x => x.TrainTeamModelAsync("test-team", It.IsAny<List<SIREN.Core.Interfaces.MLTrainingExample>>(), It.IsAny<MLTrainingOptions>()))
                .ReturnsAsync(mockTrainingResult);

            // Act
            var result = await _service.InitializeMLModelAsync();

            // Assert
            Assert.True(result.IsSuccessful);
            Assert.Equal("v1.0", result.ModelVersion);
            Assert.Equal(0.85, result.TrainingAccuracy);
        }

        [Fact]
        public async Task GenerateTrainingDatasetAsync_CallsLearningService()
        {
            // Arrange
            var fromDate = DateTime.UtcNow.AddMonths(-3);

            // Act
            await _service.GenerateTrainingDatasetAsync(fromDate);

            // Assert
            _mockLearningService.Verify(x => x.GenerateMLTrainingDatasetAsync(
                It.Is<List<string>>(list => list.Contains("test-team")), 
                fromDate), Times.Once);
        }

        [Fact]
        public async Task CategorizeSignalWithDetailsAsync_WithMLServiceException_HandlesGracefully()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "exception-test",
                Title = "Certificate problem",
                Description = "Test exception handling",
                Timestamp = DateTime.UtcNow
            };

            _mockMLService.Setup(x => x.CategorizeWithMLAsync(signal, "test-team", It.IsAny<MLModelContext>()))
                .ThrowsAsync(new Exception("ML service unavailable"));

            // Act
            var result = await _service.CategorizeSignalWithDetailsAsync(signal);

            // Assert
            Assert.NotNull(result.MLError);
            Assert.Contains("ML service unavailable", result.MLError);
            Assert.Equal("Certificate", result.FinalResult?.PredictedCategory); // Should fall back to traditional
        }

        [Theory]
        [InlineData(0.9, "ML-Primary")] // High ML confidence
        [InlineData(0.5, "Traditional-Fallback")] // Low ML confidence
        [InlineData(0.0, "Traditional-Fallback")] // Zero ML confidence
        public async Task CategorizeSignalWithDetailsAsync_WithVariousMLConfidences_ChoosesCorrectMethod(
            double mlConfidence, string expectedMethod)
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "confidence-test",
                Title = "API endpoint issue",
                Description = "Testing confidence levels",
                Timestamp = DateTime.UtcNow
            };

            var mlResult = new MLCategorizationResult
            {
                PredictedCategory = "API",
                Confidence = mlConfidence,
                ExplanationText = "Confidence test"
            };

            _mockMLService.Setup(x => x.CategorizeWithMLAsync(signal, "test-team", It.IsAny<MLModelContext>()))
                .ReturnsAsync(mlResult);

            // Act
            var result = await _service.CategorizeSignalWithDetailsAsync(signal);

            // Assert
            Assert.Equal(expectedMethod, result.FinalResult?.Method);
        }
    }
}
