using SIREN.Core.Models;
using SIREN.Core.Providers;
using Xunit;

namespace SIREN.Core.Tests.Providers
{
    public class CsvSignalProviderTests
    {
        [Fact]
        public async Task CsvSignalProvider_ShouldLoadSignalsFromCsvFile()
        {
            // Test loading signals from a CSV file
            var csvContent = """
                Summary,Created,Updated,Description,Category
                Certificate expiry issue,2025-08-22,2025-08-25,TLS certificate needs renewal,Certificate
                Bank feed connection problem,2025-08-20,2025-08-21,Customer cannot connect bank feeds,Bank Feeds
                """;

            var provider = new CsvSignalProvider(csvContent);

            // Act
            var signals = await provider.GetSignalsAsync();

            // Assert
            Assert.NotNull(signals);
            var signalList = signals.ToList();
            Assert.Equal(2, signalList.Count);
            
            var firstSignal = signalList[0];
            Assert.Equal("Certificate expiry issue", firstSignal.Title);
            Assert.Equal("TLS certificate needs renewal", firstSignal.Description);
            Assert.Equal("Certificate", firstSignal.Category);
            Assert.Equal("CSV", firstSignal.Source);
        }

        [Fact]
        public async Task CsvSignalProvider_ShouldHandleEmptyFile()
        {
            // Test graceful handling of empty CSV
            var provider = new CsvSignalProvider("");

            // Act
            var signals = await provider.GetSignalsAsync();

            // Assert
            Assert.NotNull(signals);
            Assert.Empty(signals);
        }

        [Fact]
        public async Task CsvSignalProvider_ShouldHandleHeaderOnlyFile()
        {
            // Test CSV with headers but no data
            var csvContent = "Summary,Created,Updated,Description,Category";
            var provider = new CsvSignalProvider(csvContent);

            // Act
            var signals = await provider.GetSignalsAsync();

            // Assert
            Assert.NotNull(signals);
            Assert.Empty(signals);
        }

        [Fact]
        public void CsvSignalProvider_ShouldHaveCorrectProviderName()
        {
            // Test provider name for logging/debugging
            var provider = new CsvSignalProvider("");

            // Assert
            Assert.Equal("CSV", provider.ProviderName);
        }
    }
}
