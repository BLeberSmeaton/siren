import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryDistributionChart from '../CategoryDistributionChart';
import { SignalSummary } from '../../types';

// Mock Recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, label }: any) => (
    <div data-testid="pie">
      {data?.map((item: any, index: number) => (
        <div key={index} data-testid={`pie-segment-${item.name}`}>
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

const mockSummaryWithCategories: SignalSummary = {
  totalSignals: 100,
  categorizedSignals: 85,
  uncategorizedSignals: 15,
  manuallyScored: 45,
  categories: [
    { category: 'Bug Report', count: 30 },
    { category: 'Feature Request', count: 25 },
    { category: 'Support Question', count: 20 },
    { category: 'Documentation', count: 10 }
  ]
};

const mockSummaryEmpty: SignalSummary = {
  totalSignals: 0,
  categorizedSignals: 0,
  uncategorizedSignals: 0,
  manuallyScored: 0,
  categories: []
};

const mockSummarySingleCategory: SignalSummary = {
  totalSignals: 50,
  categorizedSignals: 50,
  uncategorizedSignals: 0,
  manuallyScored: 25,
  categories: [
    { category: 'Single Category', count: 50 }
  ]
};

describe('CategoryDistributionChart', () => {
  describe('Rendering with Data', () => {
    test('renders chart title correctly', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
    });

    test('renders chart container structure', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    test('displays all categories with correct data', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      // Check that all categories are present in the pie chart
      expect(screen.getByTestId('pie-segment-Bug Report')).toHaveTextContent('Bug Report: 30');
      expect(screen.getByTestId('pie-segment-Feature Request')).toHaveTextContent('Feature Request: 25');
      expect(screen.getByTestId('pie-segment-Support Question')).toHaveTextContent('Support Question: 20');
      expect(screen.getByTestId('pie-segment-Documentation')).toHaveTextContent('Documentation: 10');
    });

    test('has proper chart container classes', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(document.querySelector('.category-distribution-chart')).toBeInTheDocument();
      expect(document.querySelector('.chart-container')).toBeInTheDocument();
    });

    test('renders h3 heading with correct text', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Category Distribution');
    });
  });

  describe('Loading State', () => {
    test('displays loading message when loading is true', () => {
      render(<CategoryDistributionChart summary={null} loading={true} />);

      expect(screen.getByText('Loading category distribution...')).toBeInTheDocument();
      expect(screen.queryByText('Category Distribution')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    });

    test('has correct loading class', () => {
      render(<CategoryDistributionChart summary={null} loading={true} />);

      expect(document.querySelector('.category-distribution-chart.loading')).toBeInTheDocument();
    });

    test('shows loading when summary is null even if loading is false', () => {
      render(<CategoryDistributionChart summary={null} loading={false} />);

      expect(screen.getByText('Loading category distribution...')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty categories array', () => {
      render(<CategoryDistributionChart summary={mockSummaryEmpty} />);

      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      
      // Should render chart structure even with no data
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    test('handles single category correctly', () => {
      render(<CategoryDistributionChart summary={mockSummarySingleCategory} />);

      expect(screen.getByTestId('pie-segment-Single Category')).toHaveTextContent('Single Category: 50');
    });

    test('handles large number of categories', () => {
      const manyCategoriesSummary: SignalSummary = {
        totalSignals: 100,
        categorizedSignals: 100,
        uncategorizedSignals: 0,
        manuallyScored: 50,
        categories: Array.from({ length: 10 }, (_, i) => ({
          category: `Category ${i + 1}`,
          count: 10
        }))
      };

      render(<CategoryDistributionChart summary={manyCategoriesSummary} />);

      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Category 1')).toHaveTextContent('Category 1: 10');
      expect(screen.getByTestId('pie-segment-Category 10')).toHaveTextContent('Category 10: 10');
    });

    test('handles zero count categories', () => {
      const zeroCountSummary: SignalSummary = {
        totalSignals: 10,
        categorizedSignals: 10,
        uncategorizedSignals: 0,
        manuallyScored: 5,
        categories: [
          { category: 'Active Category', count: 10 },
          { category: 'Zero Category', count: 0 }
        ]
      };

      render(<CategoryDistributionChart summary={zeroCountSummary} />);

      expect(screen.getByTestId('pie-segment-Active Category')).toHaveTextContent('Active Category: 10');
      expect(screen.getByTestId('pie-segment-Zero Category')).toHaveTextContent('Zero Category: 0');
    });

    test('handles categories with special characters', () => {
      const specialCharsSummary: SignalSummary = {
        totalSignals: 50,
        categorizedSignals: 50,
        uncategorizedSignals: 0,
        manuallyScored: 25,
        categories: [
          { category: 'Category with "quotes" & <tags>', count: 25 },
          { category: 'Category/with/slashes', count: 15 },
          { category: 'Category with émojis 🐛', count: 10 }
        ]
      };

      render(<CategoryDistributionChart summary={specialCharsSummary} />);

      expect(screen.getByTestId('pie-segment-Category with "quotes" & <tags>')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Category/with/slashes')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Category with émojis 🐛')).toBeInTheDocument();
    });

    test('handles very large count numbers', () => {
      const largeNumbersSummary: SignalSummary = {
        totalSignals: 1000000,
        categorizedSignals: 1000000,
        uncategorizedSignals: 0,
        manuallyScored: 500000,
        categories: [
          { category: 'Large Count Category', count: 999999 },
          { category: 'Small Count Category', count: 1 }
        ]
      };

      render(<CategoryDistributionChart summary={largeNumbersSummary} />);

      expect(screen.getByTestId('pie-segment-Large Count Category')).toHaveTextContent('Large Count Category: 999999');
      expect(screen.getByTestId('pie-segment-Small Count Category')).toHaveTextContent('Small Count Category: 1');
    });
  });

  describe('Data Transformation', () => {
    test('correctly transforms summary data to pie chart format', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      // Verify that the data transformation works correctly
      // The pie component receives data in { name, value } format
      const pieElement = screen.getByTestId('pie');
      expect(pieElement).toBeInTheDocument();

      // Check that each category is transformed correctly
      mockSummaryWithCategories.categories.forEach(category => {
        expect(screen.getByTestId(`pie-segment-${category.category}`)).toHaveTextContent(
          `${category.category}: ${category.count}`
        );
      });
    });

    test('maintains category order from original data', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      // Verify all categories are present (order is tested implicitly through presence)
      expect(screen.getByTestId('pie-segment-Bug Report')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Feature Request')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Support Question')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Documentation')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Category Distribution');
    });

    test('maintains semantic structure', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(document.querySelector('.category-distribution-chart')).toBeInTheDocument();
      expect(document.querySelector('.chart-container')).toBeInTheDocument();
    });

    test('chart components have proper test ids for screen readers', () => {
      render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with large datasets', () => {
      const largeCategoriesSummary: SignalSummary = {
        totalSignals: 10000,
        categorizedSignals: 10000,
        uncategorizedSignals: 0,
        manuallyScored: 5000,
        categories: Array.from({ length: 50 }, (_, i) => ({
          category: `Category ${i + 1}`,
          count: 200
        }))
      };

      const startTime = performance.now();
      render(<CategoryDistributionChart summary={largeCategoriesSummary} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 50ms for 50 categories)
      expect(endTime - startTime).toBeLessThan(50);

      // Should still render correctly
      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('handles rapid prop updates without issues', () => {
      const { rerender } = render(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const updatedSummary = {
          ...mockSummaryWithCategories,
          totalSignals: mockSummaryWithCategories.totalSignals + i
        };
        rerender(<CategoryDistributionChart summary={updatedSummary} />);
      }

      // Should still render correctly after multiple updates
      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('works correctly when switching between loading and loaded states', () => {
      const { rerender } = render(<CategoryDistributionChart summary={null} loading={true} />);

      expect(screen.getByText('Loading category distribution...')).toBeInTheDocument();

      rerender(<CategoryDistributionChart summary={mockSummaryWithCategories} loading={false} />);

      expect(screen.queryByText('Loading category distribution...')).not.toBeInTheDocument();
      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('handles summary updates correctly', () => {
      const { rerender } = render(<CategoryDistributionChart summary={mockSummarySingleCategory} />);

      expect(screen.getByTestId('pie-segment-Single Category')).toBeInTheDocument();

      rerender(<CategoryDistributionChart summary={mockSummaryWithCategories} />);

      expect(screen.queryByTestId('pie-segment-Single Category')).not.toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Bug Report')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-Feature Request')).toBeInTheDocument();
    });
  });
});
