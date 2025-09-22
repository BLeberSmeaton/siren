using SIREN.Core.Models;
using SIREN.Core.Services;
using Xunit;

namespace SIREN.Core.Tests.Services
{
    public class CategoryEngineTests
    {
        [Fact]
        public void CategoryEngine_ShouldCategorizeBasedOnCertificateKeywords()
        {
            // Test certificate-related content from your actual rules
            var engine = new CategoryEngine();
            var signal = new SupportSignal
            {
                Title = "Certificate expiry issue for client",
                Description = "TLS certificate needs renewal in keyvault - DigiCert"
            };

            // Act
            var category = engine.CategorizeSignal(signal);

            // Assert
            Assert.Equal("Certificate", category);
        }

        [Fact]
        public void CategoryEngine_ShouldCategorizeBasedOnBankFeedKeywords()
        {
            // Test bank feed detection
            var engine = new CategoryEngine();
            var signal = new SupportSignal
            {
                Title = "Bank Feed connection issue",
                Description = "Customer unable to connect bank feeds properly"
            };

            // Act
            var category = engine.CategorizeSignal(signal);

            // Assert
            Assert.Equal("Bank Feeds", category);
        }

        [Fact]
        public void CategoryEngine_ShouldPrioritizeCertificateWhenMultipleMatches()
        {
            // Test priority rules: Certificate should win when it ties with others
            var engine = new CategoryEngine();
            var signal = new SupportSignal
            {
                Title = "API certificate issue for customer",
                Description = "Client API key certificate problem"
            };

            // Act
            var category = engine.CategorizeSignal(signal);

            // Assert - Certificate should win due to priority rules
            Assert.Equal("Certificate", category);
        }

        [Fact]
        public void CategoryEngine_ShouldReturnNullForNoMatches()
        {
            // Test when no keywords match
            var engine = new CategoryEngine();
            var signal = new SupportSignal
            {
                Title = "Random unrelated issue",
                Description = "Something completely different"
            };

            // Act
            var category = engine.CategorizeSignal(signal);

            // Assert
            Assert.Null(category);
        }

        [Fact]
        public void CategoryEngine_ShouldHandleCaseInsensitiveMatching()
        {
            // Test case insensitive matching
            var engine = new CategoryEngine();
            var signal = new SupportSignal
            {
                Title = "CERTIFICATE EXPIRY",
                Description = "tls renewal needed"
            };

            // Act
            var category = engine.CategorizeSignal(signal);

            // Assert
            Assert.Equal("Certificate", category);
        }
    }
}
