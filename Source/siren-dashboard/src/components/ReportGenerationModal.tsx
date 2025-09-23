import React, { useState } from 'react';
import { 
  SupportSignal, 
  SignalSummary, 
  CategoryStats, 
  TeamSummary, 
  TeamConfiguration,
  ReportPeriod,
  ReportFormat,
  ReportConfiguration,
  ReportData
} from '../types';
import { generateReport } from '../services/reportService';

interface ReportGenerationModalProps {
  dashboardData: {
    signals: SupportSignal[];
    summary: SignalSummary | null;
    categoryStats: CategoryStats[];
    teams: TeamSummary[];
    selectedTeam: TeamConfiguration | null;
  };
  onClose: () => void;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ 
  dashboardData, 
  onClose 
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('all-time');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [includeTeamData, setIncludeTeamData] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New filtering options
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minimumScore, setMinimumScore] = useState<number>(0);
  const [includeUnscored, setIncludeUnscored] = useState(true);

  const calculateDateRange = (period: ReportPeriod): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const endDate = new Date(now.getTime());

    switch (period) {
      case 'week':
        return {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          endDate
        };
      case 'fortnight':
        return {
          startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          endDate
        };
      case 'month':
        return {
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate
        };
      case 'quarter':
        return {
          startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          endDate
        };
      case 'all-time':
        return {
          startDate: new Date(2020, 0, 1),
          endDate
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate),
            endDate: new Date(customEndDate)
          };
        }
        // Fallback to all-time if custom dates not set
        return {
          startDate: new Date(2020, 0, 1),
          endDate
        };
      default:
        return {
          startDate: new Date(2020, 0, 1),
          endDate
        };
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const { startDate, endDate } = calculateDateRange(period);
      
      // Validate data before generating report
      const validationResult = validateReportData(dashboardData, startDate, endDate);
      if (!validationResult.isValid) {
        alert(`Cannot generate report: ${validationResult.message}`);
        setIsGenerating(false);
        return;
      }
      
      const reportConfig: ReportConfiguration = {
        period,
        format,
        startDate,
        endDate,
        includeTeamData,
        selectedTeam: includeTeamData ? selectedTeam : undefined,
        customStartDate: period === 'custom' ? new Date(customStartDate) : undefined,
        customEndDate: period === 'custom' ? new Date(customEndDate) : undefined,
        includeCategories: selectedCategories,
        minimumScore: includeUnscored ? 0 : minimumScore,
      };

      const reportData: ReportData = {
        ...dashboardData,
        reportConfig,
        generatedAt: new Date(),
      };

      await generateReport(reportData);
      
      // Show success message
      alert(`${format.toUpperCase()} report generated successfully! Check your downloads folder.`);
      onClose();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Validation function to check if report data is sufficient
  const validateReportData = (data: typeof dashboardData, startDate: Date, endDate: Date) => {
    // Check if we have any signals at all
    if (!data.signals || data.signals.length === 0) {
      return { isValid: false, message: 'No signals available in the dashboard. Please ensure data is loaded.' };
    }

    // Filter signals by date range, categories, and score
    const filteredSignals = data.signals.filter(signal => {
      const signalDate = new Date(signal.timestamp);
      const dateInRange = signalDate >= startDate && signalDate <= endDate;
      
      // Category filtering
      const categoryMatch = selectedCategories.length === 0 || 
        selectedCategories.includes(signal.category || 'Uncategorized');
      
      // Score filtering
      const scoreMatch = includeUnscored || 
        (signal.manualScore !== undefined && signal.manualScore >= minimumScore);
      
      return dateInRange && categoryMatch && scoreMatch;
    });

    if (filteredSignals.length === 0) {
      return { 
        isValid: false, 
        message: `No signals found in the selected ${getPeriodDisplayName(period).toLowerCase()} period. Try selecting a different time range or check if there's recent data.` 
      };
    }

    // Check for minimum meaningful data
    if (filteredSignals.length < 3) {
      return { 
        isValid: false, 
        message: `Only ${filteredSignals.length} signal(s) found in the selected period. Reports require at least 3 signals for meaningful analysis.` 
      };
    }

    return { isValid: true, message: '' };
  };

  // Get live preview of what will be in the report
  const getPreviewContent = () => {
    const { startDate, endDate } = calculateDateRange(period);
    const validation = validateReportData(dashboardData, startDate, endDate);
    
    if (!validation.isValid) {
      return (
        <div className="preview-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h4>Cannot Generate Report</h4>
            <p>{validation.message}</p>
          </div>
        </div>
      );
    }

    // Filter signals to show actual data that will be in report
    const filteredSignals = dashboardData.signals.filter(signal => {
      const signalDate = new Date(signal.timestamp);
      const dateInRange = signalDate >= startDate && signalDate <= endDate;
      
      // Category filtering
      const categoryMatch = selectedCategories.length === 0 || 
        selectedCategories.includes(signal.category || 'Uncategorized');
      
      // Score filtering
      const scoreMatch = includeUnscored || 
        (signal.manualScore !== undefined && signal.manualScore >= minimumScore);
      
      return dateInRange && categoryMatch && scoreMatch;
    });

    const categoriesInRange = new Set(filteredSignals.map(s => s.category || 'Uncategorized')).size;
    const scoredSignalsInRange = filteredSignals.filter(s => s.manualScore !== undefined).length;
    const avgScoreInRange = scoredSignalsInRange > 0 
      ? filteredSignals.reduce((sum, s) => sum + (s.manualScore || 0), 0) / scoredSignalsInRange 
      : 0;

    return (
      <div className="preview-info">
        <div className="preview-status success">
          <span className="status-icon">✅</span>
          <span>Ready to generate report</span>
        </div>
        
        <div className="preview-details">
          <div className="preview-item">
            <strong>Period:</strong> {getPeriodDisplayName(period)}
          </div>
          <div className="preview-item">
            <strong>Format:</strong> {format.toUpperCase()}
          </div>
          <div className="preview-item">
            <strong>Signals in period:</strong> {filteredSignals.length} signals
          </div>
          <div className="preview-item">
            <strong>Categories:</strong> {categoriesInRange} categories
          </div>
          <div className="preview-item">
            <strong>Scored signals:</strong> {scoredSignalsInRange} ({((scoredSignalsInRange / filteredSignals.length) * 100).toFixed(0)}%)
          </div>
          {avgScoreInRange > 0 && (
            <div className="preview-item">
              <strong>Average score:</strong> {avgScoreInRange.toFixed(1)}/10
            </div>
          )}
          {includeTeamData && selectedTeam && (
            <div className="preview-item">
              <strong>Team Focus:</strong> {dashboardData.teams.find(t => t.teamName === selectedTeam)?.displayName || selectedTeam}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Check if generation should be disabled
  const isGenerationDisabled = () => {
    if (isGenerating) return true;
    
    const { startDate, endDate } = calculateDateRange(period);
    const validation = validateReportData(dashboardData, startDate, endDate);
    return !validation.isValid;
  };

  const getPeriodDisplayName = (period: ReportPeriod): string => {
    switch (period) {
      case 'week': return 'Last 7 days';
      case 'fortnight': return 'Last 14 days';
      case 'month': return 'Last 30 days';
      case 'quarter': return 'Last 90 days';
      case 'all-time': return 'All available data';
      case 'custom': return 'Custom date range';
    }
  };

  const getReportDescription = (format: ReportFormat): string => {
    switch (format) {
      case 'pdf':
        return 'Executive summary with charts, trends, and key insights. Perfect for stakeholder presentations.';
      case 'csv':
        return 'Comprehensive data export with all signal details. Ideal for detailed analysis and data processing.';
    }
  };

  return (
    <div className="report-modal">
      <div className="modal-header">
        <h2>📊 Generate Support Insights Report</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="modal-content">
        <div className="report-section">
          <h3>⏱️ Time Period</h3>
          <p>Select the time range for your report:</p>
          <div className="period-selector">
            {(['all-time', 'quarter', 'month', 'fortnight', 'week', 'custom'] as ReportPeriod[]).map((p) => (
              <label key={p} className={`period-option ${period === p ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="period"
                  value={p}
                  checked={period === p}
                  onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                />
                <div className="period-info">
                  <div className="period-name">{p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}</div>
                  <div className="period-description">{getPeriodDisplayName(p)}</div>
                </div>
              </label>
            ))}
          </div>
          
          {period === 'custom' && (
            <div className="custom-date-range">
              <div className="date-inputs">
                <div className="date-input-group">
                  <label htmlFor="start-date">Start Date:</label>
                  <input
                    type="date"
                    id="start-date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="date-input-group">
                  <label htmlFor="end-date">End Date:</label>
                  <input
                    type="date"
                    id="end-date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="report-section">
          <h3>🎯 Data Filters</h3>
          <p>Control what data gets included in your report:</p>
          
          <div className="filter-options">
            <div className="filter-group">
              <h4>📂 Categories</h4>
              <div className="category-checkboxes">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([]);
                      }
                    }}
                  />
                  All Categories ({dashboardData.categoryStats.length})
                </label>
                {dashboardData.categoryStats.map((stat) => (
                  <label key={stat.category} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(stat.category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, stat.category]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== stat.category));
                        }
                      }}
                    />
                    {stat.category} ({stat.count})
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>⭐ Score Filtering</h4>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={includeUnscored}
                  onChange={(e) => setIncludeUnscored(e.target.checked)}
                />
                Include unscored signals
              </label>
              
              {!includeUnscored && (
                <div className="score-filter">
                  <label htmlFor="min-score">Minimum Score: {minimumScore}/10</label>
                  <input
                    type="range"
                    id="min-score"
                    min="1"
                    max="10"
                    value={minimumScore}
                    onChange={(e) => setMinimumScore(Number(e.target.value))}
                    className="score-slider"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>📄 Report Format</h3>
          <p>Choose the output format that best suits your needs:</p>
          <div className="format-selector">
            {(['pdf', 'csv'] as ReportFormat[]).map((f) => (
              <label key={f} className={`format-option ${format === f ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value={f}
                  checked={format === f}
                  onChange={(e) => setFormat(e.target.value as ReportFormat)}
                />
                <div className="format-info">
                  <div className="format-name">
                    {f.toUpperCase()}
                    <span className="format-badge">{f === 'pdf' ? '📄' : '📊'}</span>
                  </div>
                  <div className="format-description">{getReportDescription(f)}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {dashboardData.teams.length > 0 && (
          <div className="report-section">
            <h3>👥 Team-Specific Data</h3>
            <div className="team-options">
              <label className="team-checkbox">
                <input
                  type="checkbox"
                  checked={includeTeamData}
                  onChange={(e) => setIncludeTeamData(e.target.checked)}
                />
                Include team-specific analysis
              </label>

              {includeTeamData && (
                <div className="team-selector-section">
                  <label htmlFor="report-team-select">Select Team:</label>
                  <select
                    id="report-team-select"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="team-select"
                  >
                    <option value="">All teams</option>
                    {dashboardData.teams.map((team) => (
                      <option key={team.teamName} value={team.teamName}>
                        {team.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="report-preview">
          <h3>📋 Report Preview</h3>
          {getPreviewContent()}
        </div>

      </div>

      <div className="modal-actions">
        <button 
          className="action-button primary"
          onClick={handleGenerateReport}
          disabled={isGenerationDisabled()}
        >
          {isGenerating ? '⏳ Generating...' : `📄 Generate ${format.toUpperCase()} Report`}
        </button>
        <button 
          className="action-button secondary"
          onClick={onClose}
          disabled={isGenerating}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
};

export default ReportGenerationModal;
