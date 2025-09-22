using SIREN.Core.Models;
using Xunit;

namespace SIREN.Core.Tests.Models
{
    public class SupportSignalTests
    {
        [Fact]
        public void SupportSignal_ShouldInitializeWithBasicProperties()
        {
            // Arrange
            var id = "JIRA-123";
            var title = "Certificate expiry issue";
            var description = "TLS certificate needs renewal";
            var source = "Jira";
            var timestamp = DateTime.UtcNow;

            // Act
            var signal = new SupportSignal
            {
                Id = id,
                Title = title,
                Description = description,
                Source = source,
                Timestamp = timestamp
            };

            // Assert
            Assert.Equal(id, signal.Id);
            Assert.Equal(title, signal.Title);
            Assert.Equal(description, signal.Description);
            Assert.Equal(source, signal.Source);
            Assert.Equal(timestamp, signal.Timestamp);
        }

        [Fact]
        public void SupportSignal_ShouldAcceptCategoryAndScore()
        {
            // Arrange & Act
            var signal = new SupportSignal
            {
                Category = "Certificate",
                ManualScore = 8.5
            };

            // Assert
            Assert.Equal("Certificate", signal.Category);
            Assert.Equal(8.5, signal.ManualScore);
        }

        [Fact]
        public void SupportSignal_ShouldAllowNullCategory()
        {
            // Arrange & Act
            var signal = new SupportSignal
            {
                Category = null
            };

            // Assert
            Assert.Null(signal.Category);
        }
    }
}
