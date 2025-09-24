using Moq;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using SIREN.Core.Services;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class SignalOrchestratorTests
    {
        private readonly Mock<ISignalProvider> _mockSignalProvider;
        private readonly Mock<ICategorizer> _mockCategorizer;
        private readonly Mock<IManualTriageService> _mockManualTriageService;
        private readonly SignalOrchestrator _orchestrator;

        private readonly List<SupportSignal> _sampleSignals;

        public SignalOrchestratorTests()
        {
            _mockSignalProvider = new Mock<ISignalProvider>();
            _mockCategorizer = new Mock<ICategorizer>();
            _mockManualTriageService = new Mock<IManualTriageService>();

            _orchestrator = new SignalOrchestrator(
                _mockSignalProvider.Object,
                _mockCategorizer.Object,
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
                    Category = "API Issues",
                    ManualScore = 7.5
                }
            };
        }

        #region Constructor Tests

        [Fact]
        public void Constructor_ShouldThrowArgumentNullException_WhenSignalProviderIsNull()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => 
                new SignalOrchestrator(null, _mockCategorizer.Object, _mockManualTriageService.Object));
        }

        [Fact]
        public void Constructor_ShouldThrowArgumentNullException_WhenCategorizerIsNull()
        {
            // Act & Assert  
            Assert.Throws<ArgumentNullException>(() => 
                new SignalOrchestrator(_mockSignalProvider.Object, null, _mockManualTriageService.Object));
        }

        [Fact]
        public void Constructor_ShouldThrowArgumentNullException_WhenManualTriageServiceIsNull()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => 
                new SignalOrchestrator(_mockSignalProvider.Object, _mockCategorizer.Object, null));
        }

        #endregion

        #region GetProcessedSignalsAsync Tests

        [Fact]
        public async Task GetProcessedSignalsAsync_ShouldReturnProcessedSignals_WhenSuccessful()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _orchestrator.GetProcessedSignalsAsync();

            // Assert
            var signalList = result.ToList();
            Assert.Equal(3, signalList.Count);
            
            // Verify categorization was applied to signals without categories
            Assert.Equal("Auto Category", signalList[0].Category);
            Assert.Equal("Existing Category", signalList[1].Category); // Should remain unchanged
            Assert.Equal("API Issues", signalList[2].Category); // Should remain unchanged

            // Verify services were called
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Once);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Once); // Only called for signal without category
            _mockManualTriageService.Verify(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()), Times.Once);
        }

        [Fact]
        public async Task GetProcessedSignalsAsync_ShouldOnlyCategorizeSignalsWithoutCategory()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            await _orchestrator.GetProcessedSignalsAsync();

            // Assert
            // Should only categorize signal-1 which has null category
            _mockCategorizer.Verify(x => x.CategorizeSignal(
                It.Is<SupportSignal>(s => s.Id == "signal-1")), Times.Once);
            _mockCategorizer.Verify(x => x.CategorizeSignal(
                It.Is<SupportSignal>(s => s.Id == "signal-2")), Times.Never);
            _mockCategorizer.Verify(x => x.CategorizeSignal(
                It.Is<SupportSignal>(s => s.Id == "signal-3")), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalsAsync_ShouldPropagateException_WhenSignalProviderFails()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ThrowsAsync(new Exception("Provider error"));

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _orchestrator.GetProcessedSignalsAsync());
        }

        #endregion

        #region GetProcessedSignalAsync Tests

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldReturnProcessedSignal_WhenSignalExists()
        {
            // Arrange
            var signalId = "signal-1";
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");

            // Act
            var result = await _orchestrator.GetProcessedSignalAsync(signalId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(signalId, result.Id);
            Assert.Equal("Auto Category", result.Category);

            // Verify services were called
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Once);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Once);
            // Manual triage should NOT be applied for single signal
            _mockManualTriageService.Verify(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldReturnNull_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "non-existent";
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _orchestrator.GetProcessedSignalAsync(signalId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldReturnNull_WhenSignalIdIsNull()
        {
            // Act
            var result = await _orchestrator.GetProcessedSignalAsync(null);

            // Assert
            Assert.Null(result);
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldReturnNull_WhenSignalIdIsEmpty()
        {
            // Act
            var result = await _orchestrator.GetProcessedSignalAsync("");

            // Assert
            Assert.Null(result);
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldReturnNull_WhenSignalIdIsWhitespace()
        {
            // Act
            var result = await _orchestrator.GetProcessedSignalAsync("   ");

            // Assert
            Assert.Null(result);
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalAsync_ShouldNotCategorizeSignalWithExistingCategory()
        {
            // Arrange
            var signalId = "signal-2"; // This signal has an existing category
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _orchestrator.GetProcessedSignalAsync(signalId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Existing Category", result.Category);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Never);
        }

        #endregion

        #region GetProcessedSignalsByCategoryAsync Tests

        [Fact]
        public async Task GetProcessedSignalsByCategoryAsync_ShouldReturnFilteredSignals_WhenCategoryMatches()
        {
            // Arrange
            var category = "API Issues";
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _orchestrator.GetProcessedSignalsByCategoryAsync(category);

            // Assert
            var signalList = result.ToList();
            Assert.Single(signalList);
            Assert.Equal("signal-3", signalList[0].Id);
            Assert.Equal(category, signalList[0].Category);
        }

        [Fact]
        public async Task GetProcessedSignalsByCategoryAsync_ShouldBeCaseInsensitive()
        {
            // Arrange
            var category = "api issues"; // Different case
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _orchestrator.GetProcessedSignalsByCategoryAsync(category);

            // Assert
            var signalList = result.ToList();
            Assert.Single(signalList);
            Assert.Equal("API Issues", signalList[0].Category); // Original case preserved
        }

        [Fact]
        public async Task GetProcessedSignalsByCategoryAsync_ShouldReturnEmpty_WhenCategoryIsNull()
        {
            // Act
            var result = await _orchestrator.GetProcessedSignalsByCategoryAsync(null);

            // Assert
            Assert.Empty(result);
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalsByCategoryAsync_ShouldReturnEmpty_WhenCategoryIsEmpty()
        {
            // Act
            var result = await _orchestrator.GetProcessedSignalsByCategoryAsync("");

            // Assert
            Assert.Empty(result);
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Never);
        }

        [Fact]
        public async Task GetProcessedSignalsByCategoryAsync_ShouldReturnEmpty_WhenNoSignalsMatchCategory()
        {
            // Arrange
            var category = "Non-existent Category";
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            var result = await _orchestrator.GetProcessedSignalsByCategoryAsync(category);

            // Assert
            Assert.Empty(result);
        }

        #endregion

        #region GetRawSignalsAsync Tests

        [Fact]
        public async Task GetRawSignalsAsync_ShouldReturnSignalsFromProvider_WithoutProcessing()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);

            // Act
            var result = await _orchestrator.GetRawSignalsAsync();

            // Assert
            var signalList = result.ToList();
            Assert.Equal(3, signalList.Count);
            Assert.Same(_sampleSignals, result); // Should return the exact same collection

            // Verify only provider was called, no processing services
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Once);
            _mockCategorizer.Verify(x => x.CategorizeSignal(It.IsAny<SupportSignal>()), Times.Never);
            _mockManualTriageService.Verify(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()), Times.Never);
        }

        [Fact]
        public async Task GetRawSignalsAsync_ShouldPropagateException_WhenProviderFails()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ThrowsAsync(new Exception("Provider error"));

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() => _orchestrator.GetRawSignalsAsync());
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task GetProcessedSignalsAsync_ShouldApplyManualTriageDataCorrectly()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");

            // Setup manual triage service to modify signals
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals =>
                {
                    var signalList = signals.ToList();
                    signalList.First(s => s.Id == "signal-1").ManualScore = 9.0;
                    return signalList;
                });

            // Act
            var result = await _orchestrator.GetProcessedSignalsAsync();

            // Assert
            var signalList = result.ToList();
            var signal1 = signalList.First(s => s.Id == "signal-1");
            Assert.Equal(9.0, signal1.ManualScore);
            Assert.Equal("Auto Category", signal1.Category);
        }

        [Fact]
        public async Task MultipleMethodCalls_ShouldEachCallProviderIndependently()
        {
            // Arrange
            _mockSignalProvider.Setup(x => x.GetSignalsAsync())
                .ReturnsAsync(_sampleSignals);
            _mockCategorizer.Setup(x => x.CategorizeSignal(It.IsAny<SupportSignal>()))
                .Returns("Auto Category");
            _mockManualTriageService.Setup(x => x.ApplyManualTriageData(It.IsAny<IEnumerable<SupportSignal>>()))
                .Returns<IEnumerable<SupportSignal>>(signals => signals);

            // Act
            await _orchestrator.GetProcessedSignalsAsync();
            await _orchestrator.GetProcessedSignalAsync("signal-1");
            await _orchestrator.GetRawSignalsAsync();

            // Assert
            _mockSignalProvider.Verify(x => x.GetSignalsAsync(), Times.Exactly(3));
        }

        #endregion
    }
}
