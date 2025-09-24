import React from 'react';
import { SignalSummary } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryDistributionChartProps {
  summary: SignalSummary | null;
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

// Generate additional colors if needed for many categories
const generateColor = (index: number): string => {
  if (index < CHART_COLORS.length) {
    return CHART_COLORS[index];
  }
  // Generate a color based on index for categories beyond the predefined palette
  const hue = (index * 137) % 360; // Golden angle approximation for good color distribution
  return `hsl(${hue}, 60%, 50%)`;
};

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ summary, loading = false }) => {
  if (loading || !summary) {
    return (
      <div className="category-distribution-chart loading">
        <div className="loading-message">Loading category distribution...</div>
      </div>
    );
  }

  const pieChartData = summary.categories.map(cat => ({
    name: cat.category,
    value: cat.count
  }));

  return (
    <div className="category-distribution-chart">
      <div className="chart-container">
        <h3>Category Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={generateColor(index)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategoryDistributionChart;

