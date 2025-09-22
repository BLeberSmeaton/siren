namespace SIREN.Core.Models
{
    public class SupportSignal
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? Category { get; set; }
        public double? ManualScore { get; set; }
    }
}
