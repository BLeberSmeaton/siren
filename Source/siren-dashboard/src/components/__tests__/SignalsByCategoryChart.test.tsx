import React from 'react';
import { render, screen } from '@testing-library/react';
import SignalsByCategoryChart from '../SignalsByCategoryChart';
import { CategoryStats } from '../../types';

// Mock Recharts components
jest.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill }: any) => (
    <div data-testid="bar" data-key={dataKey} data-fill={fill} />
  ),
  XAxis: ({ dataKey, angle, textAnchor, height }: any) => (
    <div 
      data-testid="x-axis" 
      data-key={dataKey} 
      data-angle={angle} 
      data-anchor={textAnchor}
      data-height={height}
    />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: ({ strokeDasharray }: any) => (
    <div data-testid="grid" data-stroke={strokeDasharray} />
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
}));

describe('SignalsByCategoryChart', () => {
  const mockCategoryStats: CategoryStats[] = [
    {
      category: 'Bug',
      count: 15,
      manuallyScored: 10,
      averageManualScore: 7.5,
      latestSignal: '2023-12-01T10:00:00Z',
    },
    {
      category: 'Feature Request',
      count: 8,
      manuallyScored: 5,
      averageManualScore: 6.2,
      latestSignal: '2023-12-01T11:00:00Z',
    },
    {
      category: 'Support',
      count: 22,
      manuallyScored: 18,
      averageManualScore: 5.8,
      latestSignal: '2023-12-01T12:00:00Z',
    },
  ];

  describe('Rendering', () => {
    it('renders the chart title', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      expect(screen.getByText('Signals by Category')).toBeInTheDocument();
    });

    it('renders the chart container with correct structure', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('configures ResponsiveContainer with default dimensions', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      const container = screen.getByTestId('responsive-container');
      
      expect(container).toHaveAttribute('data-width', '100%');
      expect(container).toHaveAttribute('data-height', '300');
    });

    it('configures ResponsiveContainer with custom height', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} height={400} />);
      const container = screen.getByTestId('responsive-container');
      
      expect(container).toHaveAttribute('data-height', '400');
    });

    it('configures XAxis with correct properties', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      const xAxis = screen.getByTestId('x-axis');
      
      expect(xAxis).toHaveAttribute('data-key', 'displayCategory');
      expect(xAxis).toHaveAttribute('data-angle', '-45');
      expect(xAxis).toHaveAttribute('data-anchor', 'end');
      expect(xAxis).toHaveAttribute('data-height', '80');
    });

    it('configures Bar with correct properties', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      const bar = screen.getByTestId('bar');
      
      expect(bar).toHaveAttribute('data-key', 'count');
      expect(bar).toHaveAttribute('data-fill', '#0066cc'); // primary color
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <SignalsByCategoryChart categoryStats={mockCategoryStats} className="custom-chart" />
      );
      
      expect(container.querySelector('.signals-by-category-chart.custom-chart')).toBeInTheDocument();
    });

    it('applies correct aria-label', () => {
      const { container } = render(
        <SignalsByCategoryChart 
          categoryStats={mockCategoryStats} 
          aria-label="Custom chart description"
        />
      );
      
      expect(container.querySelector('[aria-label="Custom chart description"]')).toBeInTheDocument();
    });

    it('renders accessibility table for screen readers', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      
      expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Signal Count')).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('transforms and sorts category stats data correctly', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData).toHaveLength(3);
      // Should be sorted by count descending: Support (22), Bug (15), Feature Request (8)
      expect(chartData[0]).toEqual({
        category: 'Support',
        displayCategory: 'Support',
        count: 22,
        avgScore: 5.8,
      });
      expect(chartData[1]).toEqual({
        category: 'Bug',
        displayCategory: 'Bug',
        count: 15,
        avgScore: 7.5,
      });
      expect(chartData[2]).toEqual({
        category: 'Feature Request',
        displayCategory: 'Feature Request',
        count: 8,
        avgScore: 6.2,
      });
    });

    it('handles empty category stats array by showing empty state', () => {
      render(<SignalsByCategoryChart categoryStats={[]} />);
      
      expect(screen.getByText('No category data available')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('truncates long category names for display', () => {
      const longNameStats: CategoryStats[] = [
        {
          category: 'Very Long Category Name That Should Be Truncated',
          count: 5,
          manuallyScored: 3,
          averageManualScore: 4.5,
          latestSignal: '2023-12-01T10:00:00Z',
        },
      ];

      render(<SignalsByCategoryChart categoryStats={longNameStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData[0].category).toBe('Very Long Category Name That Should Be Truncated');
      expect(chartData[0].displayCategory).toBe('Very Long Ca...');
    });

    it('filters out invalid category stats', () => {
      const mixedStats = [
        ...mockCategoryStats,
        null, // Invalid entry
        { category: '', count: 5 }, // Invalid category name
        { count: 10 }, // Missing category
      ] as any;

      render(<SignalsByCategoryChart categoryStats={mixedStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      // Should only include the valid mockCategoryStats
      expect(chartData).toHaveLength(3);
    });

    it('ensures non-negative counts', () => {
      const negativeCountStats: CategoryStats[] = [
        {
          category: 'Negative Count',
          count: -5,
          manuallyScored: 0,
          averageManualScore: 0,
          latestSignal: '2023-12-01T10:00:00Z',
        },
      ];

      render(<SignalsByCategoryChart categoryStats={negativeCountStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData[0].count).toBe(0); // Should be clamped to 0
    });
  });

  describe('Loading State', () => {
    it('shows loading state when loading is true', () => {
      render(<SignalsByCategoryChart categoryStats={[]} loading={true} />);
      
      expect(screen.getByText('Loading signals chart...')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('shows chart when loading is false', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} loading={false} />);
      
      expect(screen.queryByText('Loading signals chart...')).not.toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('defaults loading to false when not specified', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      
      expect(screen.queryByText('Loading signals chart...')).not.toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('applies correct CSS classes', () => {
      const { container } = render(<SignalsByCategoryChart categoryStats={mockCategoryStats} />);
      
      expect(container.querySelector('.signals-by-category-chart')).toBeInTheDocument();
      expect(container.querySelector('.chart-container')).toBeInTheDocument();
    });

    it('applies loading CSS class when loading', () => {
      const { container } = render(<SignalsByCategoryChart categoryStats={[]} loading={true} />);
      
      expect(container.querySelector('.signals-by-category-chart.loading')).toBeInTheDocument();
      expect(container.querySelector('.loading-message')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no valid data is available', () => {
      render(<SignalsByCategoryChart categoryStats={[]} />);
      
      expect(screen.getByText('No category data available')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('applies empty-state CSS class', () => {
      const { container } = render(<SignalsByCategoryChart categoryStats={[]} />);
      
      expect(container.querySelector('.signals-by-category-chart.empty-state')).toBeInTheDocument();
    });
  });

  describe('Average Score Feature', () => {
    it('shows average score when showAverageScore is true', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} showAverageScore={true} />);
      
      const bars = screen.getAllByTestId('bar');
      expect(bars).toHaveLength(2); // count bar + avgScore bar
    });

    it('includes average score column in accessibility table when enabled', () => {
      render(<SignalsByCategoryChart categoryStats={mockCategoryStats} showAverageScore={true} />);
      
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('handles invalid categoryStats prop gracefully', () => {
      // Spy on console.warn to test warning
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<SignalsByCategoryChart categoryStats={null as any} />);
      
      expect(consoleSpy).toHaveBeenCalledWith('SignalsByCategoryChart: categoryStats should be an array');
      expect(screen.getByText('No category data available')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles category stats with zero counts', () => {
      const zeroCountStats: CategoryStats[] = [
        {
          category: 'Empty Category',
          count: 0,
          manuallyScored: 0,
          averageManualScore: 0,
          latestSignal: '2023-12-01T10:00:00Z',
        },
      ];

      render(<SignalsByCategoryChart categoryStats={zeroCountStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData[0].count).toBe(0);
    });

    it('handles negative average scores gracefully', () => {
      const negativeScoreStats: CategoryStats[] = [
        {
          category: 'Negative Score Category',
          count: 10,
          manuallyScored: 5,
          averageManualScore: -2.5, // This shouldn't happen in practice, but we should handle it
          latestSignal: '2023-12-01T10:00:00Z',
        },
      ];

      render(<SignalsByCategoryChart categoryStats={negativeScoreStats} />);
      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
      
      expect(chartData[0].avgScore).toBe(-2.5);
    });
  });
});
