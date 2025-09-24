import React from 'react';
import { SignalSummary, CategoryStats } from '../types';

interface DashboardSummaryProps {
  summary: SignalSummary | null;
  categoryStats: CategoryStats[];
  loading?: boolean;
}


const DashboardSummary: React.FC<DashboardSummaryProps> = ({ summary, categoryStats, loading = false }) => {
  if (loading || !summary) {
    return (
      <div className="dashboard-summary loading">
        <div className="loading-message">Loading dashboard summary...</div>
      </div>
    );
  }


  return (
    <div className="dashboard-summary">
      {/* Summary Cards - TODO: Replace with Feelix Box/Card components */}
      <h2 className="dashboard-summary-title">Dashboard Overview</h2>
      <div className="summary-cards" role="region" aria-label="Dashboard summary statistics">
        <div className="summary-card primary" role="region" aria-labelledby="total-signals-label">
          <div className="card-icon" aria-hidden="true">📊</div>
          <div className="card-content">
            <div className="card-number">{summary.totalSignals.toLocaleString()}</div>
            <div className="card-label" id="total-signals-label">Total Signals</div>
          </div>
        </div>

        <div className="summary-card success" role="region" aria-labelledby="categorized-signals-label">
          <div className="card-icon" aria-hidden="true">🏷️</div>
          <div className="card-content">
            <div className="card-number">{summary.categorizedSignals.toLocaleString()}</div>
            <div className="card-label" id="categorized-signals-label">Categorized</div>
          </div>
        </div>

        <div className="summary-card warning" role="region" aria-labelledby="uncategorized-signals-label">
          <div className="card-icon" aria-hidden="true">❓</div>
          <div className="card-content">
            <div className="card-number">{summary.uncategorizedSignals.toLocaleString()}</div>
            <div className="card-label" id="uncategorized-signals-label">Uncategorized</div>
          </div>
        </div>

        <div className="summary-card info" role="region" aria-labelledby="manually-triaged-label">
          <div className="card-icon" aria-hidden="true">🎯</div>
          <div className="card-content">
            <div className="card-number">{summary.manuallyScored.toLocaleString()}</div>
            <div className="card-label" id="manually-triaged-label">Manually Triaged</div>
          </div>
        </div>

        <div className="summary-card secondary" role="region" aria-labelledby="categories-count-label">
          <div className="card-icon" aria-hidden="true">🔢</div>
          <div className="card-content">
            <div className="card-number">{summary.categories.length.toLocaleString()}</div>
            <div className="card-label" id="categories-count-label">Categories</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardSummary;
