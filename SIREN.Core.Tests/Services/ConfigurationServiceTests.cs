using SIREN.Core.Models;
using SIREN.Core.Services;
using Xunit;
using System.Text.Json;

namespace SIREN.Core.Tests.Services
{
    public class ConfigurationServiceTests
    {
        [Fact]
        public async Task ConfigurationService_ShouldLoadTeamConfiguration()
        {
            // Arrange
            var tempDir = Path.GetTempPath();
            var configDir = Path.Combine(tempDir, "siren-test-configs");
            Directory.CreateDirectory(configDir);

            var testConfig = new TeamConfiguration
            {
                TeamName = "test-team",
                DisplayName = "Test Team",
                Categories = new List<CategoryConfiguration>
                {
                    new CategoryConfiguration
                    {
                        Name = "TestCategory",
                        Keywords = new List<string> { "test", "example" },
                        Priority = 1
                    }
                }
            };

            var configPath = Path.Combine(configDir, "test-team.json");
            var jsonContent = JsonSerializer.Serialize(testConfig, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await File.WriteAllTextAsync(configPath, jsonContent);

            var configService = new ConfigurationService(configDir);

            // Act
            var result = await configService.GetTeamConfigurationAsync("test-team");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("test-team", result.TeamName);
            Assert.Equal("Test Team", result.DisplayName);
            Assert.Single(result.Categories);
            Assert.Equal("TestCategory", result.Categories.First().Name);

            // Cleanup
            Directory.Delete(configDir, true);
        }

        [Fact]
        public async Task ConfigurationService_ShouldReturnNullForNonExistentTeam()
        {
            // Arrange
            var tempDir = Path.GetTempPath();
            var configDir = Path.Combine(tempDir, "siren-empty-configs");
            Directory.CreateDirectory(configDir);

            var configService = new ConfigurationService(configDir);

            // Act
            var result = await configService.GetTeamConfigurationAsync("non-existent-team");

            // Assert
            Assert.Null(result);

            // Cleanup
            Directory.Delete(configDir, true);
        }

        [Fact]
        public async Task ConfigurationService_ShouldGetEnabledDataSources()
        {
            // Arrange
            var tempDir = Path.GetTempPath();
            var configDir = Path.Combine(tempDir, "siren-datasource-test");
            Directory.CreateDirectory(configDir);

            var testConfig = new TeamConfiguration
            {
                TeamName = "datasource-team",
                DataSources = new List<DataSourceConfiguration>
                {
                    new DataSourceConfiguration { SourceType = "CSV", IsEnabled = true },
                    new DataSourceConfiguration { SourceType = "Teams", IsEnabled = false },
                    new DataSourceConfiguration { SourceType = "Slack", IsEnabled = true }
                }
            };

            var configPath = Path.Combine(configDir, "datasource-team.json");
            var jsonContent = JsonSerializer.Serialize(testConfig, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await File.WriteAllTextAsync(configPath, jsonContent);

            var configService = new ConfigurationService(configDir);

            // Act
            var enabledSources = await configService.GetEnabledDataSourcesAsync("datasource-team");
            var sourceTypes = enabledSources.Select(s => s.SourceType).ToList();

            // Assert
            Assert.Equal(2, sourceTypes.Count);
            Assert.Contains("CSV", sourceTypes);
            Assert.Contains("Slack", sourceTypes);
            Assert.DoesNotContain("Teams", sourceTypes);

            // Cleanup
            Directory.Delete(configDir, true);
        }
    }
}
