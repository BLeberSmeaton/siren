import React, { useMemo } from 'react';
import { CategoryStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

interface SignalsByCategoryChartProps {
  categoryStats: CategoryStats[];
  loading?: boolean;
  height?: number;
  showAverageScore?: boolean;
  className?: string;
  'aria-label'?: string;
}

interface ChartData {
  category: string;
  count: number;
  avgScore: number;
  displayCategory: string; // For handling long category names
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

// Custom tooltip component for better data presentation
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartData;
    return (
      <div className="chart-tooltip" style={{ 
        backgroundColor: 'white', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        padding: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p className="tooltip-category" style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
          {data.category}
        </p>
        <p className="tooltip-count" style={{ margin: '0 0 4px 0', color: colors.primary }}>
          Signals: {data.count}
        </p>
        {data.avgScore > 0 && (
          <p className="tooltip-score" style={{ margin: '0', color: colors.secondary }}>
            Avg Score: {data.avgScore.toFixed(1)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const SignalsByCategoryChart: React.FC<SignalsByCategoryChartProps> = ({ 
  categoryStats, 
  loading = false,
  height = 300,
  showAverageScore = false,
  className = '',
  'aria-label': ariaLabel = 'Chart showing signal counts by category'
}) => {
  // Validate and prepare data
  const chartData = useMemo(() => {
    if (!Array.isArray(categoryStats)) {
      console.warn('SignalsByCategoryChart: categoryStats should be an array');
      return [];
    }

    return categoryStats
      .filter(stat => stat && typeof stat.category === 'string' && stat.category.trim().length > 0) // Filter out invalid entries
      .map(stat => {
        // Truncate long category names for display while keeping full name for tooltip
        const displayCategory = stat.category.length > 15 
          ? `${stat.category.substring(0, 12)}...` 
          : stat.category;
        
        return {
          category: stat.category,
          displayCategory,
          count: Math.max(0, stat.count || 0), // Ensure non-negative
          avgScore: stat.averageManualScore || 0
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [categoryStats]);

  // Show empty state if no data
  if (!loading && chartData.length === 0) {
    return (
      <div className={`signals-by-category-chart empty-state ${className}`}>
        <div className="chart-container">
          <h3>Signals by Category</h3>
          <div className="empty-message" style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: colors.secondary 
          }}>
            No category data available
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`signals-by-category-chart loading ${className}`}>
        <div className="chart-container">
          <h3>Signals by Category</h3>
          <div className="loading-message" style={{
            textAlign: 'center',
            padding: '40px',
            color: colors.secondary
          }}>
            Loading signals chart...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`signals-by-category-chart ${className}`} role="img" aria-label={ariaLabel}>
      <div className="chart-container">
        <h3>Signals by Category</h3>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.light} />
            <XAxis 
              dataKey="displayCategory" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
              stroke={colors.dark}
            />
            <YAxis 
              stroke={colors.dark}
              tick={{ fontSize: 12 }}
              label={{ value: 'Signal Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill={colors.primary}
              radius={[2, 2, 0, 0]} // Rounded top corners
              aria-label="Signal count by category"
            />
            {showAverageScore && (
              <Bar 
                dataKey="avgScore" 
                fill={colors.success}
                yAxisId="right"
                aria-label="Average score by category"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
        
        {/* Screen reader accessible data table */}
        <table className="sr-only" aria-label="Category signal data">
          <thead>
            <tr>
              <th>Category</th>
              <th>Signal Count</th>
              {showAverageScore && <th>Average Score</th>}
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => (
              <tr key={`${item.category}-${index}`}>
                <td>{item.category}</td>
                <td>{item.count}</td>
                {showAverageScore && <td>{item.avgScore.toFixed(1)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SignalsByCategoryChart;

