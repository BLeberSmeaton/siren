using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SIREN.API.Controllers;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using Xunit;

namespace SIREN.API.Tests.Controllers
{
    public class CategoriesControllerTests
    {
        private readonly Mock<ISignalProvider> _mockSignalProvider;
        private readonly Mock<ICategorizer> _mockCategorizer;
        private readonly Mock<ILogger<CategoriesController>> _mockLogger;
        private readonly Mock<IManualTriageService> _mockManualTriageService;
        private readonly CategoriesController _controller;

        private readonly List<SupportSignal> _sampleSignals;

        public CategoriesControllerTests()
        {
            _mockSignalProvider = new Mock<ISignalProvider>();
            _mockCategorizer = new Mock<ICategorizer>();
            _mockLogger = new Mock<ILogger<CategoriesController>>();
            _mockManualTriageService = new Mock<IManualTriageService>();
            
            _controller = new CategoriesController(
                _mockSignalProvider.Object,
                _mockCategorizer.Object,
                _mockLogger.Object,
                _mockManualTriageService.Object);

            // Sample test data with various categories and manual scores
            _sampleSignals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "signal-1",
                    Title = "Certificate Issue",
                    Description = "SSL certificate expired",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow.AddDays(-1),
                    Category = "Certificate",
                    ManualScore = 8.0
                },
                new SupportSignal
                {
                    Id = "signal-2",
                    Title = "Bank Feed Error",
                    Description = "Cannot connect to bank",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "Bank Feeds",
                    ManualScore = 6.5
                },
                new SupportSignal
                {
                    Id = "signal-3",
                    Title = "Certificate Renewal",
                    Description = "Need to renew certificate",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow.AddHours(-2),
                    Category = "Certificate",
                    ManualScore = null
                },
                new SupportSignal
                {
                    Id = "signal-4",
                    Title = "Unknown Issue",
                    Description = "Some unknown problem",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow.AddHours(-1),
                    Category = null // Will be auto-categorized
                }
            };
        }

        #region GetCategories Tests

        [Fact]
        public async Task GetCategories_ShouldReturnUniqueCategories_WhenSuccessful()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");

            // Act
            var result = await _controller.GetCategories();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var categories = Assert.IsAssignableFrom<List<string>>(okResult.Value);
            
            Assert.Equal(3, categories.Count); // Certificate, Bank Feeds, Auto Category
            Assert.Contains("Auto Category", categories);
            Assert.Contains("Bank Feeds", categories);
            Assert.Contains("Certificate", categories);
            
            // Should be ordered alphabetically
            Assert.Equal("Auto Category", categories[0]);
            Assert.Equal("Bank Feeds", categories[1]);
            Assert.Equal("Certificate", categories[2]);
        }

        [Fact]
        public async Task GetCategories_ShouldApplyAutoCategorization_ForUncategorizedSignals()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");

            // Act
            await _controller.GetCategories();

            // Assert
            // Should call categorizer for signals without categories (signal-4)
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.Is<SupportSignal>(s => s.Id == "signal-4")), Times.Once);
            
            // Should NOT call categorizer for signals that already have categories
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.Is<SupportSignal>(s => s.Id == "signal-1")), Times.Never);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.Is<SupportSignal>(s => s.Id == "signal-2")), Times.Never);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.Is<SupportSignal>(s => s.Id == "signal-3")), Times.Never);
        }

        [Fact]
        public async Task GetCategories_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetCategories();

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while loading categories", statusResult.Value);
        }

        #endregion

        #region GetCategoryStats Tests

        [Fact]
        public async Task GetCategoryStats_ShouldReturnCorrectStatistics_WhenSuccessful()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _controller.GetCategoryStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var stats = Assert.IsAssignableFrom<List<CategoryStats>>(okResult.Value);
            
            Assert.Equal(3, stats.Count);

            // Find Certificate category stats
            var certificateStats = stats.First(s => s.Category == "Certificate");
            Assert.Equal(2, certificateStats.Count); // 2 certificate signals
            Assert.Equal(1, certificateStats.ManuallyScored); // Only signal-1 has manual score
            Assert.Equal(8.0, certificateStats.AverageManualScore); // Only signal-1's score of 8.0

            // Find Bank Feeds category stats
            var bankFeedsStats = stats.First(s => s.Category == "Bank Feeds");
            Assert.Equal(1, bankFeedsStats.Count);
            Assert.Equal(1, bankFeedsStats.ManuallyScored);
            Assert.Equal(6.5, bankFeedsStats.AverageManualScore);

            // Find Auto Category stats
            var autoStats = stats.First(s => s.Category == "Auto Category");
            Assert.Equal(1, autoStats.Count);
            Assert.Equal(0, autoStats.ManuallyScored);
            Assert.Equal(0, autoStats.AverageManualScore); // Default when no manual scores
        }

        [Fact]
        public async Task GetCategoryStats_ShouldOrderByCountDescending()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _controller.GetCategoryStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var stats = Assert.IsAssignableFrom<List<CategoryStats>>(okResult.Value);
            
            // Should be ordered by count descending
            Assert.True(stats[0].Count >= stats[1].Count);
            Assert.True(stats[1].Count >= stats[2].Count);
            
            // Certificate should be first (count = 2)
            Assert.Equal("Certificate", stats[0].Category);
            Assert.Equal(2, stats[0].Count);
        }

        [Fact]
        public async Task GetCategoryStats_ShouldApplyManualTriageData()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            await _controller.GetCategoryStats();

            // Assert
            _mockManualTriageService.Verify(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()), Times.Once);
        }

        [Fact]
        public async Task GetCategoryStats_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.GetCategoryStats();

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while loading category statistics", statusResult.Value);
        }

        #endregion

        #region CategorizeSignal Tests

        [Fact]
        public async Task CategorizeSignal_ShouldUseAutoCategorization_WhenRequested()
        {
            // Arrange
            var signalId = "signal-4";
            var request = new CategorizeRequest { UseAutoCategorization = true };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Generated Category");

            // Act
            var result = await _controller.CategorizeSignal(signalId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signal = Assert.IsType<SupportSignal>(okResult.Value);
            Assert.Equal("Auto Generated Category", signal.Category);
            
            // Should call categorizer
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Once);
            
            // Should NOT call manual triage service
            _mockManualTriageService.Verify(x => x.UpdateManualCategoryAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CategorizeSignal_ShouldUseManualCategory_WhenProvided()
        {
            // Arrange
            var signalId = "signal-4";
            var manualCategory = "Manual Override Category";
            var request = new CategorizeRequest 
            { 
                UseAutoCategorization = false,
                Category = manualCategory
            };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockManualTriageService.Setup(x => x.UpdateManualCategoryAsync(signalId, manualCategory))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.CategorizeSignal(signalId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signal = Assert.IsType<SupportSignal>(okResult.Value);
            Assert.Equal(manualCategory, signal.Category);
            
            // Should NOT call categorizer
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Never);
            
            // Should call manual triage service to persist manual category
            _mockManualTriageService.Verify(x => x.UpdateManualCategoryAsync(signalId, manualCategory), Times.Once);
        }

        [Fact]
        public async Task CategorizeSignal_ShouldNotPersistManualCategory_WhenCategoryIsEmpty()
        {
            // Arrange
            var signalId = "signal-4";
            var request = new CategorizeRequest 
            { 
                UseAutoCategorization = false,
                Category = "" // Empty category
            };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _controller.CategorizeSignal(signalId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signal = Assert.IsType<SupportSignal>(okResult.Value);
            Assert.Equal("", signal.Category);
            
            // Should NOT call manual triage service when category is empty
            _mockManualTriageService.Verify(x => x.UpdateManualCategoryAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CategorizeSignal_ShouldReturnNotFound_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "non-existent";
            var request = new CategorizeRequest { UseAutoCategorization = true };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _controller.CategorizeSignal(signalId, request);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal($"Signal with ID '{signalId}' not found", notFoundResult.Value);
        }

        [Fact]
        public async Task CategorizeSignal_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            var signalId = "signal-1";
            var request = new CategorizeRequest { UseAutoCategorization = true };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ThrowsAsync(new Exception("Database error"));

            // Act
            var result = await _controller.CategorizeSignal(signalId, request);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while categorizing signal", statusResult.Value);
        }

        #endregion

        #region Logging Tests

        [Fact]
        public async Task CategorizeSignal_ShouldLogCorrectly_WhenSuccessful()
        {
            // Arrange
            var signalId = "signal-4";
            var request = new CategorizeRequest { UseAutoCategorization = false, Category = "Manual Category" };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockManualTriageService.Setup(x => x.UpdateManualCategoryAsync(It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            await _controller.CategorizeSignal(signalId, request);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Signal {signalId} categorized as Manual Category (manual: True)")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task CategorizeSignal_ShouldLogAutoCategorizationCorrectly()
        {
            // Arrange
            var signalId = "signal-4";
            var request = new CategorizeRequest { UseAutoCategorization = true };
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");

            // Act
            await _controller.CategorizeSignal(signalId, request);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Signal {signalId} categorized as Auto Category (manual: False)")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        #endregion

        #region Edge Cases Tests

        [Fact]
        public async Task GetCategories_ShouldHandleEmptySignalList()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(new List<SupportSignal>());

            // Act
            var result = await _controller.GetCategories();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var categories = Assert.IsAssignableFrom<List<string>>(okResult.Value);
            Assert.Empty(categories);
        }

        [Fact]
        public async Task GetCategoryStats_ShouldHandleSignalsWithOnlyNullCategories()
        {
            // Arrange
            var signalsWithoutCategories = new List<SupportSignal>
            {
                new SupportSignal { Id = "1", Title = "Test", Description = "Test", Source = "Test", Timestamp = DateTime.UtcNow, Category = null },
                new SupportSignal { Id = "2", Title = "Test", Description = "Test", Source = "Test", Timestamp = DateTime.UtcNow, Category = null }
            };

            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(signalsWithoutCategories);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _controller.GetCategoryStats();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var stats = Assert.IsAssignableFrom<List<CategoryStats>>(okResult.Value);
            
            Assert.Single(stats);
            Assert.Equal("Auto Category", stats[0].Category);
            Assert.Equal(2, stats[0].Count);
        }

        #endregion
    }
}
