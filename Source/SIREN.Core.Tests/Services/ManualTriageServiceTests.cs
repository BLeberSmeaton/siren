using System.Text.Json;
using SIREN.Core.Models;
using SIREN.Core.Services;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class ManualTriageServiceTests : IDisposable
    {
        private readonly string _testDataPath;
        private readonly ManualTriageService _service;

        public ManualTriageServiceTests()
        {
            // Use a unique test file path to avoid conflicts
            _testDataPath = Path.Combine(Path.GetTempPath(), $"test_manual_triage_{Guid.NewGuid()}.json");
            _service = new ManualTriageService(_testDataPath);
        }

        public void Dispose()
        {
            // Clean up test files
            if (File.Exists(_testDataPath))
            {
                File.Delete(_testDataPath);
            }

            // Clean up directory if it was created for testing
            var directory = Path.GetDirectoryName(_testDataPath);
            if (!string.IsNullOrEmpty(directory) && Directory.Exists(directory) && 
                directory != Path.GetTempPath()) // Don't delete temp directory itself
            {
                try
                {
                    Directory.Delete(directory);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
        }

        [Fact]
        public async Task UpdateManualScoreAsync_ShouldCreateNewEntry_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "test-signal-1";
            var score = 8.5;

            // Act
            await _service.UpdateManualScoreAsync(signalId, score);

            // Assert
            var result = _service.GetManualTriageData(signalId);
            Assert.NotNull(result);
            Assert.Equal(signalId, result.SignalId);
            Assert.Equal(score, result.ManualScore);
            Assert.True(result.LastUpdated > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task UpdateManualScoreAsync_ShouldUpdateExistingEntry_WhenSignalExists()
        {
            // Arrange
            var signalId = "test-signal-1";
            var initialScore = 5.0;
            var updatedScore = 9.0;

            await _service.UpdateManualScoreAsync(signalId, initialScore);
            var initialData = _service.GetManualTriageData(signalId);
            var initialTime = initialData!.LastUpdated;

            // Wait a small amount to ensure timestamp difference
            await Task.Delay(10);

            // Act
            await _service.UpdateManualScoreAsync(signalId, updatedScore);

            // Assert
            var result = _service.GetManualTriageData(signalId);
            Assert.NotNull(result);
            Assert.Equal(signalId, result.SignalId);
            Assert.Equal(updatedScore, result.ManualScore);
            Assert.True(result.LastUpdated > initialTime);
        }

        [Fact]
        public async Task UpdateManualCategoryAsync_ShouldCreateNewEntry_WhenSignalDoesNotExist()
        {
            // Arrange
            var signalId = "test-signal-2";
            var category = "Critical Issue";

            // Act
            await _service.UpdateManualCategoryAsync(signalId, category);

            // Assert
            var result = _service.GetManualTriageData(signalId);
            Assert.NotNull(result);
            Assert.Equal(signalId, result.SignalId);
            Assert.Equal(category, result.ManualCategory);
            Assert.True(result.LastUpdated > DateTime.UtcNow.AddMinutes(-1));
        }

        [Fact]
        public async Task UpdateManualCategoryAsync_ShouldUpdateExistingEntry_WhenSignalExists()
        {
            // Arrange
            var signalId = "test-signal-2";
            var initialCategory = "Low Priority";
            var updatedCategory = "High Priority";

            await _service.UpdateManualCategoryAsync(signalId, initialCategory);
            var initialData = _service.GetManualTriageData(signalId);
            var initialTime = initialData!.LastUpdated;

            await Task.Delay(10);

            // Act
            await _service.UpdateManualCategoryAsync(signalId, updatedCategory);

            // Assert
            var result = _service.GetManualTriageData(signalId);
            Assert.NotNull(result);
            Assert.Equal(signalId, result.SignalId);
            Assert.Equal(updatedCategory, result.ManualCategory);
            Assert.True(result.LastUpdated > initialTime);
        }

        [Fact]
        public void GetManualTriageData_ShouldReturnNull_WhenSignalDoesNotExist()
        {
            // Arrange
            var nonExistentSignalId = "non-existent-signal";

            // Act
            var result = _service.GetManualTriageData(nonExistentSignalId);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task ApplyManualTriageData_ShouldApplyManualScore_WhenTriageDataExists()
        {
            // Arrange
            var signalId = "test-signal-3";
            var manualScore = 7.5;
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = signalId,
                    Title = "Test Signal",
                    Description = "Test Description",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    ManualScore = null // Initially no manual score
                }
            };

            await _service.UpdateManualScoreAsync(signalId, manualScore);

            // Act
            var result = _service.ApplyManualTriageData(signals).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal(manualScore, result[0].ManualScore);
        }

        [Fact]
        public async Task ApplyManualTriageData_ShouldApplyManualCategory_WhenTriageDataExists()
        {
            // Arrange
            var signalId = "test-signal-4";
            var manualCategory = "Manual Override Category";
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = signalId,
                    Title = "Test Signal",
                    Description = "Test Description",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "Original Category"
                }
            };

            await _service.UpdateManualCategoryAsync(signalId, manualCategory);

            // Act
            var result = _service.ApplyManualTriageData(signals).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal(manualCategory, result[0].Category);
        }

        [Fact]
        public async Task ApplyManualTriageData_ShouldApplyBothScoreAndCategory_WhenBothExist()
        {
            // Arrange
            var signalId = "test-signal-5";
            var manualScore = 6.0;
            var manualCategory = "Both Applied";
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = signalId,
                    Title = "Test Signal",
                    Description = "Test Description",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "Original Category",
                    ManualScore = null
                }
            };

            await _service.UpdateManualScoreAsync(signalId, manualScore);
            await _service.UpdateManualCategoryAsync(signalId, manualCategory);

            // Act
            var result = _service.ApplyManualTriageData(signals).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal(manualScore, result[0].ManualScore);
            Assert.Equal(manualCategory, result[0].Category);
        }

        [Fact]
        public void ApplyManualTriageData_ShouldNotModifySignals_WhenNoTriageDataExists()
        {
            // Arrange
            var signals = new List<SupportSignal>
            {
                new SupportSignal
                {
                    Id = "no-triage-data",
                    Title = "Test Signal",
                    Description = "Test Description",
                    Source = "Test",
                    Timestamp = DateTime.UtcNow,
                    Category = "Original Category",
                    ManualScore = 3.0
                }
            };

            // Act
            var result = _service.ApplyManualTriageData(signals).ToList();

            // Assert
            Assert.Single(result);
            Assert.Equal("Original Category", result[0].Category);
            Assert.Equal(3.0, result[0].ManualScore);
        }

        [Fact]
        public async Task GetAllManualTriageData_ShouldReturnAllEntries()
        {
            // Arrange
            await _service.UpdateManualScoreAsync("signal-1", 5.0);
            await _service.UpdateManualCategoryAsync("signal-2", "Category A");
            await _service.UpdateManualScoreAsync("signal-3", 7.0);
            await _service.UpdateManualCategoryAsync("signal-3", "Category B");

            // Act
            var result = _service.GetAllManualTriageData();

            // Assert
            Assert.Equal(3, result.Count);
            Assert.Contains("signal-1", result.Keys);
            Assert.Contains("signal-2", result.Keys);
            Assert.Contains("signal-3", result.Keys);

            Assert.Equal(5.0, result["signal-1"].ManualScore);
            Assert.Equal("Category A", result["signal-2"].ManualCategory);
            Assert.Equal(7.0, result["signal-3"].ManualScore);
            Assert.Equal("Category B", result["signal-3"].ManualCategory);
        }

        [Fact]
        public void GetAllManualTriageData_ShouldReturnEmptyDictionary_WhenNoDataExists()
        {
            // Act
            var result = _service.GetAllManualTriageData();

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void Constructor_ShouldCreateDirectory_WhenDirectoryDoesNotExist()
        {
            // Arrange
            var testDir = Path.Combine(Path.GetTempPath(), $"test_dir_{Guid.NewGuid()}");
            var testPath = Path.Combine(testDir, "test.json");

            try
            {
                Assert.False(Directory.Exists(testDir));

                // Act
                var service = new ManualTriageService(testPath);

                // Assert
                Assert.True(Directory.Exists(testDir));
            }
            finally
            {
                // Cleanup
                if (Directory.Exists(testDir))
                {
                    Directory.Delete(testDir, true);
                }
            }
        }

        [Fact]
        public async Task ConcurrentUpdates_ShouldBeThreadSafe()
        {
            // Arrange
            var signalId = "concurrent-test";
            var tasks = new List<Task>();
            var scores = new List<double> { 1.0, 2.0, 3.0, 4.0, 5.0 };

            // Act - Run concurrent updates
            foreach (var score in scores)
            {
                var capturedScore = score; // Avoid closure issues
                tasks.Add(Task.Run(async () => 
                {
                    await _service.UpdateManualScoreAsync(signalId, capturedScore);
                }));
            }

            await Task.WhenAll(tasks);

            // Assert - Should have completed without errors and have valid data
            var result = _service.GetManualTriageData(signalId);
            Assert.NotNull(result);
            Assert.Equal(signalId, result.SignalId);
            Assert.NotNull(result.ManualScore);
            Assert.Contains(result.ManualScore.Value, scores); // Should be one of the scores
        }

        [Fact]
        public async Task PersistenceIntegration_ShouldSaveAndLoadDataCorrectly()
        {
            // Arrange & Act - Add data and verify it persists within the same service instance
            await _service.UpdateManualScoreAsync("signal-1", 8.0);
            await _service.UpdateManualCategoryAsync("signal-2", "Test Category");

            // Assert - Verify data exists
            var result1 = _service.GetManualTriageData("signal-1");
            Assert.NotNull(result1);
            Assert.Equal("signal-1", result1.SignalId);
            Assert.Equal(8.0, result1.ManualScore);

            var result2 = _service.GetManualTriageData("signal-2");
            Assert.NotNull(result2);
            Assert.Equal("signal-2", result2.SignalId);
            Assert.Equal("Test Category", result2.ManualCategory);

            // Verify the file was created
            Assert.True(File.Exists(_testDataPath));
            var fileContent = await File.ReadAllTextAsync(_testDataPath);
            Assert.Contains("signal-1", fileContent);
            Assert.Contains("signal-2", fileContent);
        }

        [Fact]
        public void Constructor_ShouldHandleCorruptedFile_Gracefully()
        {
            // Arrange - Create a corrupted JSON file
            File.WriteAllText(_testDataPath, "{ corrupted json }");

            // Act & Assert - Should not throw exception
            var exception = Record.Exception(() => new ManualTriageService(_testDataPath));
            Assert.Null(exception);

            var service = new ManualTriageService(_testDataPath);
            var result = service.GetAllManualTriageData();
            Assert.Empty(result); // Should start with empty data
        }

        [Fact]
        public void Constructor_ShouldHandleEmptyFile_Gracefully()
        {
            // Arrange - Create empty file
            File.WriteAllText(_testDataPath, "");

            // Act & Assert
            var exception = Record.Exception(() => new ManualTriageService(_testDataPath));
            Assert.Null(exception);

            var service = new ManualTriageService(_testDataPath);
            var result = service.GetAllManualTriageData();
            Assert.Empty(result);
        }
    }
}
