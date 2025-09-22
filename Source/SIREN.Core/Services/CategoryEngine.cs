using SIREN.Core.Interfaces;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Implements the keyword-based categorization engine from your existing Python system
    /// Maps issue content to categories based on the rules in IssueType.csv
    /// </summary>
    public class CategoryEngine : ICategorizer
    {
        // Category definitions based on your IssueType.csv
        private readonly Dictionary<string, string[]> _categoryKeywords = new()
        {
            { "API", new[] { "API", "Public API", "endpoint", "key", "rate limiting" } },
            { "Certificate", new[] { "certificate", "expiry", "renewal", "thumbprint", "TLS", "keyvault", "DigiCert", "certificate install" } },
            { "Supplier Feeds", new[] { "supplier feed", "mapping", "ledger", "integrator", "connection", "supplierId", "NZ migrations" } },
            { "Bank Feeds", new[] { "bank feed", "Bank Feed", "bank feeds" } },
            { "Prod Errors", new[] { "error", "error message", "504", "503", "timeout", "GatewayTimeout", "InternalServerError", "fail", "500", "critical", "unexpected", "failures", "alert", "test failing" } },
            { "Feature Support", new[] { "consent", "Mydot User ID", "Administrator", "user role", "permission", "Consent App", "OAuthToken", "ConsentIsInvalid", "scope", "TPAM", "validation", "authorization", "company file selection", "CanonicalLogs", "Canonical", "Westpac" } },
            { "Customer Support", new[] { "publicly available", "client", "exposed", "customer", "customer confusion", "documentation", "IP", "IP addresses", "Solo" } },
            { "Other", new[] { "decommission", "cleanup", "legacy", "miscellaneous", "improvements", "patch", "update", "DNA key rotation", "unit test coverage", "infrastructure", "version" } },
            { "Release Effort", new[] { "GoCD", "deploy", "pipeline", "release", "GoCD agents", "decomission", "decommission" } },
            { "Access Requests", new[] { "Grant access", "Grant", "grant" } },
            { "Security", new[] { "vulnerability", "nucleus", "Vulnerability", "vulnerabilities", "DDoS", "Wiz" } },
            { "Prod/Test", new[] { "SIT", "PROD", "environment", "testing", "demo", "test website" } }
        };

        // Priority categories (from your rules) - these win on ties
        private readonly string[] _priorityCategories = { "Certificate", "Bank Feeds", "Security" };

        public string? CategorizeSignal(SupportSignal signal)
        {
            if (signal == null)
                return null;

            // Combine title and description for analysis
            var content = $"{signal.Title} {signal.Description}".ToLower();
            
            if (string.IsNullOrWhiteSpace(content))
                return null;

            // Count matches for each category
            var categoryMatches = new Dictionary<string, int>();

            foreach (var (category, keywords) in _categoryKeywords)
            {
                var matchCount = keywords.Count(keyword => 
                    content.Contains(keyword.ToLower(), StringComparison.OrdinalIgnoreCase));
                
                if (matchCount > 0)
                {
                    categoryMatches[category] = matchCount;
                }
            }

            if (!categoryMatches.Any())
                return null;

            // Apply ABSOLUTE priority rules first (from your original rules)
            // Certificate, Bank Feeds, Security always win if they match AND overlap with others
            foreach (var priorityCategory in _priorityCategories)
            {
                if (categoryMatches.ContainsKey(priorityCategory) && categoryMatches.Count > 1)
                    return priorityCategory;
            }

            // If no priority override, use highest match count
            var maxMatches = categoryMatches.Values.Max();
            var topCategories = categoryMatches.Where(kv => kv.Value == maxMatches).Select(kv => kv.Key).ToList();

            // If only one top category, return it
            if (topCategories.Count == 1)
                return topCategories.First();

            // For true ties in non-priority categories, return first alphabetically
            return topCategories.OrderBy(c => c).First();
        }
    }
}
