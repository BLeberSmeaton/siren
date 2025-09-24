using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SIREN.API.Controllers;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using Xunit;

namespace SIREN.API.Tests.Controllers
{
    public class SignalsControllerTests
    {
        private readonly Mock<ISignalOrchestrator> _mockSignalOrchestrator;
        private readonly Mock<ILogger<SignalsController>> _mockLogger;
        private readonly Mock<IManualTriageService> _mockManualTriageService;
        private readonly SignalsController _controller;

        private readonly List<SupportSignal> _sampleSignals;

        public SignalsControllerTests()
        {
            _mockSignalOrchestrator = new Mock<ISignalOrchestrator>();
            _mockLogger = new Mock<ILogger<SignalsController>>();
            _mockManualTriageService = new Mock<IManualTriageService>();
            
            _controller = new SignalsController(
                _mockSignalOrchestrator.Object,
                _mockLogger.Object,
                _mockManualTriageService.Object);

            // Sample test data
            _sampleSignals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "signal-1",
                    Title = "Test Signal 1",
                    Description = "Description 1",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = null // Will be auto-categorized
                },
                new SupportSignal
                {
                    Id = "signal-2",
                    Title = "Test Signal 2",
                    Description = "Description 2",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "Existing Category"
                },
                new SupportSignal
                {
                    Id = "signal-3",
                    Title = "Test Signal 3",
                    Description = "Description 3",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = null,
                    ManualScore = 7.5 // Has manual triage data
                }
            };
        }

        #region GetSignals Tests

        [Fact]
        public async Task GetSignals_ShouldReturnOkWithSignals_WhenSuccessful()
        {
            // Arrange
            var processedSignals = new List<SupportSignal>
            {
                new SupportSignal { Id = "signal-1", Title = "Test 1", Description = "Desc 1", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Auto Category" },
                new SupportSignal { Id = "signal-2", Title = "Test 2", Description = "Desc 2", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Existing Category" },
                new SupportSignal { Id = "signal-3", Title = "Test 3", Description = "Desc 3", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Auto Category", ManualScore = 7.5 }
            };
            
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ReturnsAsync(processedSignals);

            // Act
            var result = await _controller.GetSignals();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signals = Assert.IsAssignableFrom<List<SupportSignal>>(okResult.Value);
            Assert.Equal(3, signals.Count);
            
            // Verify orchestrator was called
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetSignals_ShouldCallOrchestrator_WhenProcessingSignals()
        {
            // Arrange
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            await _controller.GetSignals();

            // Assert
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetSignals_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ThrowsAsync(new Exception("Orchestrator error"));

            // Act
            var result = await _controller.GetSignals();

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while loading signals", statusResult.Value);
        }

        #endregion

        #region GetSignal Tests

        [Fact]
        public async Task GetSignal_ShouldReturnOkWithSignal_WhenSignalExists()
        {
            // Arrange
            var signalId = "signal-1";
            var expectedSignal = new SupportSignal
            {
                Id = signalId,
                Title = "Test Signal 1",
                Description = "Description 1",
                Source = "Test",
                Timestamp = DateTime.UtcNow,
                Category = "Auto Category"
            };
            
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalAsync(signalId))
                .ReturnsAsync(expectedSignal);

            // Act
            var result = await _controller.GetSignal(signalId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signal = Assert.IsType<SupportSignal>(okResult.Value);
            Assert.Equal(signalId, signal.Id);
            Assert.Equal("Auto Category", signal.Category);
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalAsync(signalId), Times.Once);
        }

        [Fact]
        public async Task GetSignal_ShouldReturnNotFound_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "non-existent";
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalAsync(signalId))
                .ReturnsAsync((SupportSignal)null);

            // Act
            var result = await _controller.GetSignal(signalId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal($"Signal with ID '{signalId}' not found", notFoundResult.Value);
        }

        [Fact]
        public async Task GetSignal_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            var signalId = "signal-1";
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalAsync(signalId))
                .ThrowsAsync(new Exception("Orchestrator error"));

            // Act
            var result = await _controller.GetSignal(signalId);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while loading signal", statusResult.Value);
        }

        #endregion

        #region UpdateManualScore Tests

        [Fact]
        public async Task UpdateManualScore_ShouldReturnOkWithUpdatedSignal_WhenSuccessful()
        {
            // Arrange
            var signalId = "signal-1";
            var request = new ManualScoreRequest { Score = 8.5 };
            _mockSignalOrchestrator.Setup(x => x.GetRawSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockManualTriageService.Setup(x => x.UpdateManualScoreAsync(signalId, request.Score))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UpdateManualScore(signalId, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signal = Assert.IsType<SupportSignal>(okResult.Value);
            Assert.Equal(signalId, signal.Id);
            Assert.Equal(request.Score, signal.ManualScore);
            
            // Verify services were called
            _mockSignalOrchestrator.Verify(x => x.GetRawSignalsAsync(), Times.Once);
            _mockManualTriageService.Verify(x => x.UpdateManualScoreAsync(signalId, request.Score), Times.Once);
        }

        [Fact]
        public async Task UpdateManualScore_ShouldReturnNotFound_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "non-existent";
            var request = new ManualScoreRequest { Score = 8.5 };
            _mockSignalOrchestrator.Setup(x => x.GetRawSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _controller.UpdateManualScore(signalId, request);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal($"Signal with ID '{signalId}' not found", notFoundResult.Value);
            
            // Verify manual triage service was not called
            _mockManualTriageService.Verify(x => x.UpdateManualScoreAsync(It.IsAny<string>(), It.IsAny<double>()), Times.Never);
        }

        [Fact]
        public async Task UpdateManualScore_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            var signalId = "signal-1";
            var request = new ManualScoreRequest { Score = 8.5 };
            _mockSignalOrchestrator.Setup(x => x.GetRawSignalsAsync())
                .ThrowsAsync(new Exception("Orchestrator error"));

            // Act
            var result = await _controller.UpdateManualScore(signalId, request);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while updating signal", statusResult.Value);
        }

        #endregion

        #region GetSignalsByCategory Tests

        [Fact]
        public async Task GetSignalsByCategory_ShouldReturnFilteredSignals_WhenSuccessful()
        {
            // Arrange
            var category = "Test Category";
            var filteredSignals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "signal-1",
                    Title = "Test Signal 1",
                    Description = "Description 1",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = category
                }
            };
            
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsByCategoryAsync(category))
                .ReturnsAsync(filteredSignals);

            // Act
            var result = await _controller.GetSignalsByCategory(category);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signals = Assert.IsAssignableFrom<List<SupportSignal>>(okResult.Value);
            Assert.Single(signals);
            Assert.Equal(category, signals[0].Category);
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalsByCategoryAsync(category), Times.Once);
        }

        [Fact]
        public async Task GetSignalsByCategory_ShouldBeCaseInsensitive()
        {
            // Arrange
            var category = "test category";
            var filteredSignals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "signal-1",
                    Title = "Test Signal 1",
                    Description = "Description 1",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "TEST CATEGORY" // Different case
                }
            };
            
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsByCategoryAsync(category))
                .ReturnsAsync(filteredSignals);

            // Act
            var result = await _controller.GetSignalsByCategory(category);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var signals = Assert.IsAssignableFrom<List<SupportSignal>>(okResult.Value);
            Assert.Single(signals);
            Assert.Equal("TEST CATEGORY", signals[0].Category);
        }

        [Fact]
        public async Task GetSignalsByCategory_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            var category = "Test Category";
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsByCategoryAsync(category))
                .ThrowsAsync(new Exception("Orchestrator error"));

            // Act
            var result = await _controller.GetSignalsByCategory(category);

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while filtering signals", statusResult.Value);
        }

        #endregion

        #region GetSummary Tests

        [Fact]
        public async Task GetSummary_ShouldReturnCorrectStatistics_WhenSuccessful()
        {
            // Arrange - setup processed signals that the orchestrator would return
            var processedSignals = new List<SupportSignal>
            {
                new SupportSignal { Id = "1", Title = "Signal 1", Description = "Desc", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Category A", ManualScore = 5.0 },
                new SupportSignal { Id = "2", Title = "Signal 2", Description = "Desc", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Category A", ManualScore = null },
                new SupportSignal { Id = "3", Title = "Signal 3", Description = "Desc", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Category B", ManualScore = 7.0 },
                new SupportSignal { Id = "4", Title = "Signal 4", Description = "Desc", Source = "Test", Timestamp = DateTime.UtcNow, Category = "Auto Category", ManualScore = null } // Processed by orchestrator
            };

            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ReturnsAsync(processedSignals);

            // Act
            var result = await _controller.GetSummary();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var summary = Assert.IsType<SignalSummary>(okResult.Value);
            
            Assert.Equal(4, summary.TotalSignals);
            Assert.Equal(4, summary.CategorizedSignals); // All categorized (processed by orchestrator)
            Assert.Equal(0, summary.UncategorizedSignals);
            Assert.Equal(2, summary.ManuallyScored); // Only 2 have manual scores
            Assert.Equal(3, summary.Categories.Count); // Category A, Category B, Auto Category
            
            // Check category counts
            var categoryA = summary.Categories.First(c => c.Category == "Category A");
            Assert.Equal(2, categoryA.Count);
            
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetSummary_ShouldCallOrchestrator_WhenGeneratingStatistics()
        {
            // Arrange
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            await _controller.GetSummary();

            // Assert
            _mockSignalOrchestrator.Verify(x => x.GetProcessedSignalsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetSummary_ShouldReturn500_WhenExceptionOccurs()
        {
            // Arrange
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ThrowsAsync(new Exception("Orchestrator error"));

            // Act
            var result = await _controller.GetSummary();

            // Assert
            var statusResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusResult.StatusCode);
            Assert.Equal("Internal server error while generating summary", statusResult.Value);
        }

        #endregion

        #region Logging Tests

        [Fact]
        public async Task GetSignals_ShouldLogCorrectly_WhenSuccessful()
        {
            // Arrange
            _mockSignalOrchestrator.Setup(x => x.GetProcessedSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            await _controller.GetSignals();

            // Assert
            // Verify logging calls were made (checking that logger was called)
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Loading and processing signals")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Successfully loaded and categorized")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task UpdateManualScore_ShouldLogCorrectly_WhenSuccessful()
        {
            // Arrange
            var signalId = "signal-1";
            var request = new ManualScoreRequest { Score = 8.5 };
            _mockSignalOrchestrator.Setup(x => x.GetRawSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockManualTriageService.Setup(x => x.UpdateManualScoreAsync(signalId, request.Score))
                .Returns(Task.CompletedTask);

            // Act
            await _controller.UpdateManualScore(signalId, request);

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains($"Updated manual score for signal {signalId} to {request.Score}")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        #endregion
    }
}
