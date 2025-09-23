using System.Text.Json;
using SIREN.Core.Models;

namespace SIREN.Core.Services
{
    /// <summary>
    /// Service to handle persistence of manual triage data (scores and category overrides)
    /// This provides a non-breaking way to persist manual triage without changing the ISignalProvider interface
    /// </summary>
    public class ManualTriageService
    {
        private readonly string _dataPath;
        private readonly Dictionary<string, ManualTriageData> _cache;
        private readonly SemaphoreSlim _fileLock;

        public ManualTriageService(string dataPath = "Data/manual_triage.json")
        {
            _dataPath = dataPath;
            _cache = new Dictionary<string, ManualTriageData>();
            _fileLock = new SemaphoreSlim(1, 1);
            
            // Ensure directory exists
            var directory = Path.GetDirectoryName(_dataPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
            
            // Load existing data
            LoadFromFile();
        }

        /// <summary>
        /// Update manual score for a signal
        /// </summary>
        public async Task UpdateManualScoreAsync(string signalId, double score)
        {
            await _fileLock.WaitAsync();
            try
            {
                if (!_cache.ContainsKey(signalId))
                {
                    _cache[signalId] = new ManualTriageData { SignalId = signalId };
                }
                
                _cache[signalId].ManualScore = score;
                _cache[signalId].LastUpdated = DateTime.UtcNow;
                
                await SaveToFileAsync();
            }
            finally
            {
                _fileLock.Release();
            }
        }

        /// <summary>
        /// Update manual category for a signal
        /// </summary>
        public async Task UpdateManualCategoryAsync(string signalId, string category)
        {
            await _fileLock.WaitAsync();
            try
            {
                if (!_cache.ContainsKey(signalId))
                {
                    _cache[signalId] = new ManualTriageData { SignalId = signalId };
                }
                
                _cache[signalId].ManualCategory = category;
                _cache[signalId].LastUpdated = DateTime.UtcNow;
                
                await SaveToFileAsync();
            }
            finally
            {
                _fileLock.Release();
            }
        }

        /// <summary>
        /// Get manual triage data for a signal
        /// </summary>
        public ManualTriageData? GetManualTriageData(string signalId)
        {
            _cache.TryGetValue(signalId, out var data);
            return data;
        }

        /// <summary>
        /// Apply manual triage data to a collection of signals
        /// </summary>
        public IEnumerable<SupportSignal> ApplyManualTriageData(IEnumerable<SupportSignal> signals)
        {
            var signalList = signals.ToList();
            
            foreach (var signal in signalList)
            {
                if (_cache.TryGetValue(signal.Id, out var triageData))
                {
                    // Apply manual score if available
                    if (triageData.ManualScore.HasValue)
                    {
                        signal.ManualScore = triageData.ManualScore.Value;
                    }
                    
                    // Apply manual category override if available
                    if (!string.IsNullOrEmpty(triageData.ManualCategory))
                    {
                        signal.Category = triageData.ManualCategory;
                    }
                }
            }
            
            return signalList;
        }

        /// <summary>
        /// Get all manual triage data for statistics calculations
        /// </summary>
        public IReadOnlyDictionary<string, ManualTriageData> GetAllManualTriageData()
        {
            return _cache.ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        private void LoadFromFile()
        {
            try
            {
                if (File.Exists(_dataPath))
                {
                    var json = File.ReadAllText(_dataPath);
                    if (!string.IsNullOrWhiteSpace(json))
                    {
                        var data = JsonSerializer.Deserialize<Dictionary<string, ManualTriageData>>(json);
                        if (data != null)
                        {
                            foreach (var kvp in data)
                            {
                                _cache[kvp.Key] = kvp.Value;
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                // Log error in real implementation - for now, continue with empty cache
            }
        }

        private async Task SaveToFileAsync()
        {
            try
            {
                var json = JsonSerializer.Serialize(_cache, new JsonSerializerOptions 
                { 
                    WriteIndented = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                
                await File.WriteAllTextAsync(_dataPath, json);
            }
            catch (Exception)
            {
                // Log error in real implementation - continue operation
            }
        }
    }

    /// <summary>
    /// Data structure for manual triage information
    /// </summary>
    public class ManualTriageData
    {
        public string SignalId { get; set; } = string.Empty;
        public double? ManualScore { get; set; }
        public string? ManualCategory { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
