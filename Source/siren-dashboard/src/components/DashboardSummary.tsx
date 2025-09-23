import React from 'react';
import { SignalSummary, CategoryStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardSummaryProps {
  summary: SignalSummary | null;
  categoryStats: CategoryStats[];
  loading?: boolean;
}

// Feelix-inspired design tokens (placeholder - replace with actual Feelix tokens)
const colors = {
  primary: '#0066cc',
  secondary: '#6c757d',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  light: '#f8f9fa',
  dark: '#343a40'
};

const CHART_COLORS = [colors.primary, colors.secondary, colors.warning, colors.success, colors.danger, '#17a2b8'];

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ summary, categoryStats, loading = false }) => {
  if (loading || !summary) {
    return (
      <div className="dashboard-summary loading">
        <div className="loading-message">Loading dashboard summary...</div>
      </div>
    );
  }

  // Prepare data for charts
  const categoryChartData = categoryStats.map(stat => ({
    category: stat.category,
    count: stat.count,
    avgScore: stat.averageManualScore
  }));

  const pieChartData = summary.categories.map(cat => ({
    name: cat.category,
    value: cat.count
  }));

  return (
    <div className="dashboard-summary">
      {/* Summary Cards - TODO: Replace with Feelix Box/Card components */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-number">{summary.totalSignals}</div>
            <div className="card-label">Total Signals</div>
          </div>
        </div>

        <div className="summary-card success">
          <div className="card-icon">🏷️</div>
          <div className="card-content">
            <div className="card-number">{summary.categorizedSignals}</div>
            <div className="card-label">Categorized</div>
          </div>
        </div>

        <div className="summary-card warning">
          <div className="card-icon">❓</div>
          <div className="card-content">
            <div className="card-number">{summary.uncategorizedSignals}</div>
            <div className="card-label">Uncategorized</div>
          </div>
        </div>

        <div className="summary-card info">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <div className="card-number">{summary.manuallyScored}</div>
            <div className="card-label">Manually Triaged</div>
          </div>
        </div>

        <div className="summary-card secondary">
          <div className="card-icon">🔢</div>
          <div className="card-content">
            <div className="card-number">{summary.categories.length}</div>
            <div className="card-label">Categories</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Signals by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={colors.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Stats Table */}
      <div className="category-stats">
        <h3>Category Statistics</h3>
        <div className="stats-table">
          <div className="table-header">
            <div>Category</div>
            <div>Count</div>
            <div>Manually Scored</div>
            <div>Avg Score</div>
            <div>Latest</div>
          </div>
          {categoryStats.map((stat, index) => (
            <div key={`category-${index}-${stat.category}`} className="table-row">
              <div className="category-name">{stat.category}</div>
              <div>{stat.count}</div>
              <div>{stat.manuallyScored}</div>
              <div>
                {stat.averageManualScore > 0 ? stat.averageManualScore.toFixed(1) : '-'}
              </div>
              <div>{new Date(stat.latestSignal).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
