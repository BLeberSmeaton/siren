using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using SIREN.Core.Services;
using Moq;
using System.IO;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class PatternLearningServiceTests : IDisposable
    {
        private readonly Mock<IConfigurationService> _mockConfigService;
        private readonly PatternLearningService _service;
        private readonly string _testDataPath;

        public PatternLearningServiceTests()
        {
            _mockConfigService = new Mock<IConfigurationService>();
            _testDataPath = Path.Combine(Path.GetTempPath(), "PatternLearningTests", Guid.NewGuid().ToString());
            Directory.CreateDirectory(_testDataPath);
            
            _service = new PatternLearningService(_mockConfigService.Object, _testDataPath);
        }

        public void Dispose()
        {
            if (Directory.Exists(_testDataPath))
            {
                Directory.Delete(_testDataPath, recursive: true);
            }
        }

        [Fact]
        public async Task RecordCategorizationFeedbackAsync_CreatesValidFeedbackRecord()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-signal-1",
                Title = "API certificate issue",
                Description = "Certificate problem with API endpoint",
                Source = "Jira",
                Timestamp = DateTime.UtcNow
            };

            // Act
            await _service.RecordCategorizationFeedbackAsync(
                "test-team", signal, "API", "Certificate", 0.75, "test-user");

            // Assert - Check that feedback file was created
            var feedbackFiles = Directory.GetFiles(_testDataPath, "feedback_*.json");
            Assert.Single(feedbackFiles);
        }

        [Fact]
        public async Task RecordCategorizationFeedbackAsync_WithCorrectPrediction_MarksAsCorrect()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "correct-prediction",
                Title = "Certificate expiry",
                Description = "TLS certificate needs renewal",
                Source = "Teams", 
                Timestamp = DateTime.UtcNow
            };

            // Act
            await _service.RecordCategorizationFeedbackAsync(
                "test-team", signal, "Certificate", "Certificate", 0.9);

            // Assert - Verify the feedback was recorded as correct
            var teamInsights = await _service.GetTeamLearningInsightsAsync("test-team");
            Assert.Equal(1, teamInsights.TotalFeedbackRecords);
            Assert.Equal(1.0, teamInsights.AccuracyRate); // 100% accuracy
        }

        [Fact]
        public async Task RecordCategorizationFeedbackAsync_WithIncorrectPrediction_MarksAsIncorrect()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "incorrect-prediction",
                Title = "API issue",
                Description = "Endpoint timeout problem", 
                Source = "Jira",
                Timestamp = DateTime.UtcNow
            };

            // Act
            await _service.RecordCategorizationFeedbackAsync(
                "test-team", signal, "Database", "API", 0.6); // Predicted wrong

            // Assert
            var teamInsights = await _service.GetTeamLearningInsightsAsync("test-team");
            Assert.Equal(1, teamInsights.TotalFeedbackRecords);
            Assert.Equal(0.0, teamInsights.AccuracyRate); // 0% accuracy
        }

        [Fact]
        public async Task GetTeamLearningInsightsAsync_WithMixedFeedback_CalculatesCorrectAccuracy()
        {
            // Arrange
            var signals = new[]
            {
                new SupportSignal { Id = "1", Title = "Cert issue", Timestamp = DateTime.UtcNow },
                new SupportSignal { Id = "2", Title = "API problem", Timestamp = DateTime.UtcNow },
                new SupportSignal { Id = "3", Title = "DB error", Timestamp = DateTime.UtcNow },
                new SupportSignal { Id = "4", Title = "Another cert", Timestamp = DateTime.UtcNow }
            };

            // Act - Record mixed correct/incorrect predictions
            await _service.RecordCategorizationFeedbackAsync("test-team", signals[0], "Certificate", "Certificate", 0.9); // Correct
            await _service.RecordCategorizationFeedbackAsync("test-team", signals[1], "API", "API", 0.8); // Correct
            await _service.RecordCategorizationFeedbackAsync("test-team", signals[2], "API", "Database", 0.7); // Incorrect
            await _service.RecordCategorizationFeedbackAsync("test-team", signals[3], "Database", "Certificate", 0.6); // Incorrect

            var insights = await _service.GetTeamLearningInsightsAsync("test-team");

            // Assert
            Assert.Equal(4, insights.TotalFeedbackRecords);
            Assert.Equal(0.5, insights.AccuracyRate); // 2/4 = 50%
            Assert.Equal(3, insights.CategoryAccuracy.Count); // Certificate, API, Database
            Assert.Equal(0.5, insights.CategoryAccuracy["Certificate"]); // 1/2 correct (1 correct, 1 incorrect)
            Assert.Equal(1.0, insights.CategoryAccuracy["API"]); // 1/1 correct
        }

        [Fact]
        public async Task SuggestKeywordImprovementsAsync_WithMisclassifications_SuggestsKeywords()
        {
            // Arrange - Set up misclassifications
            var signal1 = new SupportSignal 
            { 
                Id = "1", 
                Title = "SSL certificate expired", 
                Description = "HTTPS certificate needs update",
                Timestamp = DateTime.UtcNow 
            };
            var signal2 = new SupportSignal 
            { 
                Id = "2", 
                Title = "Certificate renewal failed", 
                Description = "Auto-renewal process failed for cert",
                Timestamp = DateTime.UtcNow 
            };

            // Record misclassifications where Certificate was predicted as API
            await _service.RecordCategorizationFeedbackAsync("test-team", signal1, "API", "Certificate", 0.6);
            await _service.RecordCategorizationFeedbackAsync("test-team", signal2, "API", "Certificate", 0.7);

            // Act
            var suggestions = await _service.SuggestKeywordImprovementsAsync("test-team");

            // Assert
            Assert.NotEmpty(suggestions);
            var certSuggestion = suggestions.FirstOrDefault(s => s.CategoryName == "Certificate");
            Assert.NotNull(certSuggestion);
            Assert.Contains("SSL", certSuggestion.SuggestedKeywords.Select(k => k.ToUpper()));
        }

        [Fact]
        public async Task LearnPatternsFromSampleDataAsync_WithValidData_GeneratesSuggestions()
        {
            // Arrange
            var sampleSignals = new List<SupportSignal>
            {
                new SupportSignal 
                { 
                    Id = "1", 
                    Title = "Payment gateway timeout", 
                    Description = "Stripe payment failing with timeout",
                    Timestamp = DateTime.UtcNow 
                },
                new SupportSignal 
                { 
                    Id = "2", 
                    Title = "Credit card processing error", 
                    Description = "Payment method declined by processor",
                    Timestamp = DateTime.UtcNow 
                },
                new SupportSignal 
                { 
                    Id = "3", 
                    Title = "Transaction fee calculation", 
                    Description = "Fee calculation logic incorrect for payments",
                    Timestamp = DateTime.UtcNow 
                }
            };

            // Act
            var result = await _service.LearnPatternsFromSampleDataAsync(
                "team-payments", sampleSignals, new List<string> { "team-api", "team-infrastructure" });

            // Assert
            Assert.Equal("team-payments", result.TeamName);
            Assert.Equal(3, result.AnalyzedSignalCount);
            Assert.True(result.ConfidenceScore >= 0.0 && result.ConfidenceScore <= 1.0);
        }

        [Fact]
        public async Task GenerateMLTrainingDatasetAsync_CreatesValidDataset()
        {
            // Arrange - Set up some feedback data
            var signal = new SupportSignal 
            { 
                Id = "ml-test", 
                Title = "Database connection failed", 
                Description = "SQL Server connection timeout",
                Timestamp = DateTime.UtcNow 
            };

            await _service.RecordCategorizationFeedbackAsync("test-team", signal, "Database", "Database", 0.85);

            // Act
            var dataset = await _service.GenerateMLTrainingDatasetAsync(new List<string> { "test-team" });

            // Assert
            Assert.NotNull(dataset);
            Assert.Contains("test-team", dataset.Teams);
            Assert.Single(dataset.TrainingExamples);
            
            var example = dataset.TrainingExamples.First();
            Assert.Equal("Database connection failed SQL Server connection timeout", example.InputText);
            Assert.Equal("Database", example.TrueCategory);
            Assert.Equal("test-team", example.TeamContext);
        }

        [Theory]
        [InlineData("Payment", new[] { "payment", "gateway", "stripe" }, 2)]
        [InlineData("Authentication", new[] { "login", "auth", "token" }, 1)]
        public async Task LearnPatternsFromSampleDataAsync_WithSpecificPatterns_DetectsCorrectly(
            string expectedPattern, string[] keywords, int minSignals)
        {
            // Arrange
            var signals = new List<SupportSignal>();
            for (int i = 0; i < minSignals + 1; i++)
            {
                signals.Add(new SupportSignal
                {
                    Id = $"pattern-{i}",
                    Title = $"{keywords[0]} issue {i}",
                    Description = string.Join(" ", keywords) + $" problem number {i}",
                    Timestamp = DateTime.UtcNow.AddDays(-i)
                });
            }

            // Act
            var result = await _service.LearnPatternsFromSampleDataAsync(
                "pattern-test-team", signals, new List<string>());

            // Assert
            Assert.True(result.AnalyzedSignalCount >= minSignals);
            Assert.NotEmpty(result.SuggestedCategories);
            // Verify the expected pattern type was detected (use expectedPattern in assertion)
            Assert.Contains(result.SuggestedCategories, c => c.Name.Contains(expectedPattern, StringComparison.OrdinalIgnoreCase) || keywords.Any(k => c.Keywords.Contains(k)));
        }

        [Fact]
        public async Task GetTeamLearningInsightsAsync_WithNoData_ReturnsEmptyInsights()
        {
            // Act
            var insights = await _service.GetTeamLearningInsightsAsync("non-existent-team");

            // Assert
            Assert.Equal("non-existent-team", insights.TeamName);
            Assert.Equal(0, insights.TotalFeedbackRecords);
            Assert.Equal(0.0, insights.AccuracyRate);
            Assert.Empty(insights.CategoryAccuracy);
            Assert.Empty(insights.CommonMisclassifications);
        }

        [Fact]
        public async Task RecordCategorizationFeedbackAsync_WithLargeFeedbackHistory_LimitsToMaxRecords()
        {
            // Arrange - Create more than 1000 feedback records
            var signal = new SupportSignal 
            { 
                Id = "bulk-test", 
                Title = "Test signal", 
                Description = "Bulk testing signal",
                Timestamp = DateTime.UtcNow 
            };

            // Act - Add many feedback records
            for (int i = 0; i < 1100; i++)
            {
                await _service.RecordCategorizationFeedbackAsync(
                    "bulk-team", signal, "Category1", "Category2", 0.5);
            }

            var insights = await _service.GetTeamLearningInsightsAsync("bulk-team");

            // Assert - Should be limited to 1000 records
            Assert.True(insights.TotalFeedbackRecords <= 1000);
        }
    }
}
