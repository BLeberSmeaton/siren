using SIREN.Core.Models;

namespace SIREN.Core.Interfaces
{
    /// <summary>
    /// Interface for categorizing support signals based on content analysis
    /// This will implement the keyword-based categorization rules from your existing Python system
    /// </summary>
    public interface ICategorizer
    {
        /// <summary>
        /// Analyzes a support signal and determines its category based on content
        /// </summary>
        /// <param name="signal">The support signal to categorize</param>
        /// <returns>Category name if match found, null if no category matches</returns>
        string? CategorizeSignal(SupportSignal signal);
    }
}
