using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using Xunit;

namespace SIREN.Core.Tests.Interfaces
{
    public class ISignalProviderTests
    {
        [Fact]
        public async Task ISignalProvider_ShouldReturnSupportSignals()
        {
            // This test verifies that any implementation of ISignalProvider
            // can return a collection of SupportSignal objects
            
            // We'll implement a mock provider for testing
            var mockProvider = new MockSignalProvider();
            
            // Act
            var signals = await mockProvider.GetSignalsAsync();
            
            // Assert
            Assert.NotNull(signals);
            Assert.IsAssignableFrom<IEnumerable<SupportSignal>>(signals);
        }

        [Fact]
        public async Task ISignalProvider_ShouldHandleEmptyResults()
        {
            // Providers should gracefully handle cases with no data
            var emptyProvider = new EmptySignalProvider();
            
            // Act
            var signals = await emptyProvider.GetSignalsAsync();
            
            // Assert
            Assert.NotNull(signals);
            Assert.Empty(signals);
        }
    }

    // Test implementations to verify interface design
    public class MockSignalProvider : ISignalProvider
    {
        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(1); // Simulate async operation
            return new List<SupportSignal>
            {
                new SupportSignal 
                { 
                    Id = "TEST-1", 
                    Title = "Test Signal",
                    Source = "MockProvider"
                }
            };
        }

        public string ProviderName => "Mock";
    }

    public class EmptySignalProvider : ISignalProvider
    {
        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(1);
            return new List<SupportSignal>();
        }

        public string ProviderName => "Empty";
    }
}
