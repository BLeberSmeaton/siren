using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using SIREN.Core.Services;
using Moq;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class EnhancedPatternRecognitionEngineTests
    {
        private readonly Mock<IConfigurationService> _mockConfigService;
        private readonly EnhancedPatternRecognitionEngine _engine;
        private readonly List<CategoryConfiguration> _sampleCategories;

        public EnhancedPatternRecognitionEngineTests()
        {
            _mockConfigService = new Mock<IConfigurationService>();
            _engine = new EnhancedPatternRecognitionEngine(_mockConfigService.Object, "test-team");
            
            _sampleCategories = new List<CategoryConfiguration>
            {
                new CategoryConfiguration
                {
                    Name = "API",
                    DisplayName = "API Issues",
                    Keywords = new List<string> { "API", "endpoint", "rate limiting", "key" },
                    Priority = 2,
                    IsActive = true
                },
                new CategoryConfiguration
                {
                    Name = "Certificate",
                    DisplayName = "Certificate Management",
                    Keywords = new List<string> { "certificate", "TLS", "expiry", "renewal", "thumbprint" },
                    Priority = 1,
                    IsActive = true
                },
                new CategoryConfiguration
                {
                    Name = "Database",
                    DisplayName = "Database Issues", 
                    Keywords = new List<string> { "database", "SQL", "connection", "query" },
                    Priority = 3,
                    IsActive = true
                }
            };

            _mockConfigService.Setup(x => x.GetActiveCategoriesAsync("test-team"))
                .ReturnsAsync(_sampleCategories);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithExactKeywordMatch_ReturnsCorrectCategory()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-1",
                Title = "API endpoint issue",
                Description = "Rate limiting problem with client API key",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert
            Assert.Equal("API", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithPriorityConflict_ReturnsPriorityCategory()
        {
            // Arrange - Signal that matches both API and Certificate keywords
            var signal = new SupportSignal
            {
                Id = "test-2", 
                Title = "API certificate renewal needed",
                Description = "Client API requires new TLS certificate",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Certificate should win due to lower priority number (higher priority)
            Assert.Equal("Certificate", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithFuzzyMatch_HandlesMisspellings()
        {
            // Arrange - Signal with slight misspelling
            var signal = new SupportSignal
            {
                Id = "test-3",
                Title = "Certificat expiry issue", // Missing 'e' in certificate
                Description = "TLS certificat needs renewal",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Should still match Certificate due to fuzzy matching
            Assert.Equal("Certificate", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithPatternMatch_DetectsTechnicalPatterns()
        {
            // Arrange - Signal with HTTP error pattern
            var signal = new SupportSignal
            {
                Id = "test-4",
                Title = "Getting 504 error from service",
                Description = "HTTP 504 timeout when calling the endpoint",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Should match API category due to HTTP pattern and endpoint keyword
            Assert.Equal("API", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithNoMatch_ReturnsNull()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-5",
                Title = "Random unrelated issue",
                Description = "Something completely different with no matching keywords",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithEmptyContent_ReturnsNull()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-6",
                Title = "",
                Description = "",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithNullSignal_ReturnsNull()
        {
            // Act
            var result = await _engine.CategorizeSignalAsync(null!);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithInactiveCategories_IgnoresInactiveCategory()
        {
            // Arrange
            var inactiveCategories = new List<CategoryConfiguration>
            {
                new CategoryConfiguration
                {
                    Name = "InactiveCategory",
                    Keywords = new List<string> { "inactive", "test" },
                    Priority = 1,
                    IsActive = false // This category is inactive
                }
            };

            _mockConfigService.Setup(x => x.GetActiveCategoriesAsync("test-team"))
                .ReturnsAsync(inactiveCategories);

            var signal = new SupportSignal
            {
                Id = "test-7",
                Title = "Inactive test issue",
                Description = "This matches inactive keywords",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Should return null since the matching category is inactive
            Assert.Null(result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithCaseInsensitiveMatch_WorksCorrectly()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-8",
                Title = "CERTIFICATE EXPIRY ALERT",
                Description = "tls renewal required immediately",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert
            Assert.Equal("Certificate", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithMultipleKeywordMatches_CountsCorrectly()
        {
            // Arrange - Signal with multiple certificate keywords
            var signal = new SupportSignal
            {
                Id = "test-9",
                Title = "Certificate expiry and renewal issue",
                Description = "TLS certificate thumbprint needs updating due to expiry",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Should match Certificate due to multiple keyword matches
            Assert.Equal("Certificate", result);
        }

        [Fact]
        public async Task CategorizeSignalAsync_WithRecentTimestamp_AppliesContextualScoring()
        {
            // Arrange - Recent signal (within 24 hours)
            var signal = new SupportSignal
            {
                Id = "test-10",
                Title = "API issue just occurred", 
                Description = "Recent API endpoint problem",
                Timestamp = DateTime.UtcNow.AddHours(-1) // 1 hour ago
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert - Should still categorize correctly with recent timestamp bonus
            Assert.Equal("API", result);
        }

        [Theory]
        [InlineData("Teams", "Certificate", "Certificate")] // Teams source with certificate gets bonus
        [InlineData("Jira", "API", "API")] // Jira source with API gets bonus  
        [InlineData("Email", "Database", "Database")] // No source bonus
        public async Task CategorizeSignalAsync_WithDifferentSources_AppliesSourceScoring(
            string source, string expectedKeyword, string expectedCategory)
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "test-source",
                Title = $"{expectedKeyword} issue from {source}",
                Description = $"Problem with {expectedKeyword.ToLower()} reported",
                Source = source,
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = await _engine.CategorizeSignalAsync(signal);

            // Assert
            Assert.Equal(expectedCategory, result);
        }

        [Fact]
        public void CategorizeSignal_SynchronousVersion_WorksCorrectly()
        {
            // Arrange
            var signal = new SupportSignal
            {
                Id = "sync-test",
                Title = "Certificate issue",
                Description = "TLS certificate problem",
                Timestamp = DateTime.UtcNow
            };

            // Act
            var result = _engine.CategorizeSignal(signal);

            // Assert
            Assert.Equal("Certificate", result);
        }
    }
}
