using SIREN.Core.Interfaces;
using SIREN.Core.Models;
using Xunit;

namespace SIREN.Core.Tests.Interfaces
{
    public class ICategorizerTests
    {
        [Fact]
        public void ICategorizer_ShouldCategorizeSignalBasedOnContent()
        {
            // Test that categorizer can analyze signal content and assign category
            var categorizer = new MockCategorizer();
            var signal = new SupportSignal
            {
                Title = "Certificate expiry issue",
                Description = "TLS certificate needs renewal in keyvault"
            };

            // Act
            var category = categorizer.CategorizeSignal(signal);

            // Assert
            Assert.Equal("Certificate", category);
        }

        [Fact]
        public void ICategorizer_ShouldReturnNullForUnknownContent()
        {
            // Test that categorizer handles content that doesn't match any category
            var categorizer = new MockCategorizer();
            var signal = new SupportSignal
            {
                Title = "Random unrelated content",
                Description = "Something that doesn't match any keywords"
            };

            // Act
            var category = categorizer.CategorizeSignal(signal);

            // Assert
            Assert.Null(category);
        }

        [Fact]
        public void ICategorizer_ShouldHandleNullOrEmptyContent()
        {
            // Test graceful handling of edge cases
            var categorizer = new MockCategorizer();
            var signal = new SupportSignal();

            // Act
            var category = categorizer.CategorizeSignal(signal);

            // Assert
            Assert.Null(category);
        }
    }

    // Mock implementation for testing interface design
    public class MockCategorizer : ICategorizer
    {
        public string? CategorizeSignal(SupportSignal signal)
        {
            if (string.IsNullOrEmpty(signal.Title) && string.IsNullOrEmpty(signal.Description))
                return null;

            var content = $"{signal.Title} {signal.Description}".ToLower();
            
            // Simple mock logic - we'll implement the real rules later
            if (content.Contains("certificate") || content.Contains("tls") || content.Contains("keyvault"))
                return "Certificate";
                
            return null; // No category match
        }
    }
}
