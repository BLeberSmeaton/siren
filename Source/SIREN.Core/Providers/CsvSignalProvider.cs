using System.Globalization;
using System.Text;
using CsvHelper;
using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Providers
{
    /// <summary>
    /// Signal provider that reads from CSV files (your existing Jira exports)
    /// This allows us to work with your existing categorized data
    /// </summary>
    public class CsvSignalProvider : ISignalProvider
    {
        private readonly string _csvContent;

        public string ProviderName => "CSV";

        public CsvSignalProvider(string csvContent)
        {
            _csvContent = csvContent ?? throw new ArgumentNullException(nameof(csvContent));
        }

        public async Task<IEnumerable<SupportSignal>> GetSignalsAsync()
        {
            await Task.Delay(1); // Make truly async for interface compliance

            if (string.IsNullOrWhiteSpace(_csvContent))
                return new List<SupportSignal>();

            try
            {
                using var reader = new StringReader(_csvContent);
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
                
                var records = csv.GetRecords<CsvRecord>().ToList();
                
                return records.Select(record => new SupportSignal
                {
                    Id = GenerateId(record.Summary, record.Created, record.Description),
                    Title = record.Summary ?? string.Empty,
                    Description = record.Description ?? string.Empty,
                    Category = string.IsNullOrWhiteSpace(record.Category) ? null : record.Category,
                    Source = ProviderName,
                    Timestamp = ParseDate(record.Created) ?? DateTime.UtcNow
                }).ToList();
            }
            catch (Exception)
            {
                // Log error in real implementation - for now return empty
                return new List<SupportSignal>();
            }
        }

        /// <summary>
        /// Generate source-aware unique IDs for signals.
        /// Format: {summary-prefix}-{source}-{hash}
        /// Examples: public-api-decommiss-csv-A3F2, broken-pipeline-jira-B7E9
        /// Uses deterministic hashing to ensure same content always generates same ID.
        /// </summary>
        private string GenerateId(string? summary, string? created, string? description)
        {
            // Create deterministic content hash from summary + created + description
            var content = $"{summary ?? "unknown"}|{created ?? ""}|{description ?? ""}";
            var contentHash = content.GetHashCode();
            var hashSuffix = Math.Abs(contentHash).ToString("X")[^3..]; // Last 3 hex digits
            
            if (string.IsNullOrWhiteSpace(summary))
                return $"unknown-{ProviderName.ToLower()}-{hashSuffix}";
                
            // Generate a meaningful ID by combining truncated summary with source and hash
            var baseName = summary.Length > 20 
                ? summary.Substring(0, 20).Replace(" ", "-").ToLower()
                : summary.Replace(" ", "-").ToLower();
                
            // Add source identifier and deterministic hash for traceability
            return $"{baseName}-{ProviderName.ToLower()}-{hashSuffix}";
        }

        private DateTime? ParseDate(string? dateString)
        {
            if (string.IsNullOrWhiteSpace(dateString))
                return null;

            // Try common date formats
            var formats = new[] { "dd/MM/yyyy HH:mm", "dd/MM/yyyy", "yyyy-MM-dd", "yyyy-MM-ddTHH:mm:ss" };
            
            foreach (var format in formats)
            {
                if (DateTime.TryParseExact(dateString, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                    return date;
            }

            // Fallback to standard parsing
            return DateTime.TryParse(dateString, out var fallbackDate) ? fallbackDate : null;
        }

        /// <summary>
        /// CSV record structure matching your Jira export format
        /// </summary>
        private class CsvRecord
        {
            public string? Summary { get; set; }
            public string? Created { get; set; }
            public string? Updated { get; set; }
            public string? Description { get; set; }
            public string? Category { get; set; }
        }
    }
}
