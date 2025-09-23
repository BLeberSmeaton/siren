namespace SIREN.Core.Models
{
    /// <summary>
    /// Configuration for a team using SIREN
    /// Defines their data sources, categories, and team-specific settings
    /// </summary>
    public class TeamConfiguration
    {
        public string TeamName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<DataSourceConfiguration> DataSources { get; set; } = new();
        public List<CategoryConfiguration> Categories { get; set; } = new();
        public TriageConfiguration TriageSettings { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Configuration for a specific data source (CSV, Teams, Slack, Jira, etc.)
    /// </summary>
    public class DataSourceConfiguration
    {
        public string SourceType { get; set; } = string.Empty; // "CSV", "Teams", "Slack", "Jira"
        public string Name { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        public Dictionary<string, string> Settings { get; set; } = new();
        public List<string> ApplicableCategories { get; set; } = new();
    }

    /// <summary>
    /// Category/tag configuration - based on your IssueType.csv but extensible
    /// </summary>
    public class CategoryConfiguration
    {
        public string Name { get; set; } = string.Empty; // "API", "Certificate", etc.
        public string DisplayName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<string> Keywords { get; set; } = new();
        public int Priority { get; set; } = 0; // For tie-breaking
        public string? Color { get; set; } // For dashboard visualization
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Team-specific triage and scoring settings
    /// </summary>
    public class TriageConfiguration
    {
        public bool EnableManualScoring { get; set; } = true;
        public int DefaultScore { get; set; } = 5;
        public List<string> HighPriorityCategories { get; set; } = new();
        public Dictionary<string, int> CategoryDefaultScores { get; set; } = new();
    }
}
