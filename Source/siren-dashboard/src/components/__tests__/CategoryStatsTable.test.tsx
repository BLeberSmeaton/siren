import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryStatsTable from '../CategoryStatsTable';
import { CategoryStats } from '../../types';

const mockCategoryStats: CategoryStats[] = [
  {
    category: 'Bug Report',
    count: 15,
    manuallyScored: 8,
    averageManualScore: 7.5,
    latestSignal: '2023-12-01T10:00:00Z'
  },
  {
    category: 'Feature Request',
    count: 10,
    manuallyScored: 5,
    averageManualScore: 6.2,
    latestSignal: '2023-11-30T14:30:00Z'
  },
  {
    category: 'Support Question',
    count: 20,
    manuallyScored: 12,
    averageManualScore: 5.8,
    latestSignal: '2023-12-02T09:15:00Z'
  }
];

const mockEmptyStats: CategoryStats[] = [];

const mockStatsWithZeroScore: CategoryStats[] = [
  {
    category: 'No Score Category',
    count: 5,
    manuallyScored: 0,
    averageManualScore: 0,
    latestSignal: '2023-12-01T10:00:00Z'
  }
];

describe('CategoryStatsTable', () => {
  describe('Rendering with Data', () => {
    test('renders table header correctly', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      expect(screen.getByText('Category Statistics')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('Manually Scored')).toBeInTheDocument();
      expect(screen.getByText('Avg Score')).toBeInTheDocument();
      expect(screen.getByText('Latest')).toBeInTheDocument();
    });

    test('renders category data correctly', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      // Check all categories are displayed
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
      expect(screen.getByText('Support Question')).toBeInTheDocument();

      // Check counts
      expect(screen.getByText('15')).toBeInTheDocument(); // Bug Report count
      expect(screen.getByText('10')).toBeInTheDocument(); // Feature Request count
      expect(screen.getByText('20')).toBeInTheDocument(); // Support Question count

      // Check manually scored counts
      expect(screen.getByText('8')).toBeInTheDocument();  // Bug Report manually scored
      expect(screen.getByText('5')).toBeInTheDocument();  // Feature Request manually scored
      expect(screen.getByText('12')).toBeInTheDocument(); // Support Question manually scored

      // Check average scores (formatted to 1 decimal place)
      expect(screen.getByText('7.5')).toBeInTheDocument();
      expect(screen.getByText('6.2')).toBeInTheDocument();
      expect(screen.getByText('5.8')).toBeInTheDocument();
    });

    test('formats dates correctly', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      // Check that dates are formatted as locale date strings
      // The exact format depends on locale, but should contain date parts
      const dateElements = screen.getAllByText(/\/|\-|\./); // Common date separators
      expect(dateElements.length).toBeGreaterThan(0);
    });

    test('displays correct table structure', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(3); // 3 categories

      // Each row should have the correct structure
      tableRows.forEach(row => {
        expect(row.children).toHaveLength(5); // Category, Count, Manually Scored, Avg Score, Latest
      });
    });

    test('uses proper key props for table rows', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows[0]).toHaveAttribute('class', 'table-row');

      // Check that the category name is properly displayed in first column
      const categoryNameElements = document.querySelectorAll('.category-name');
      expect(categoryNameElements).toHaveLength(3);
      expect(categoryNameElements[0]).toHaveTextContent('Bug Report');
      expect(categoryNameElements[1]).toHaveTextContent('Feature Request');
      expect(categoryNameElements[2]).toHaveTextContent('Support Question');
    });
  });

  describe('Loading State', () => {
    test('displays loading message when loading is true', () => {
      render(<CategoryStatsTable categoryStats={[]} loading={true} />);

      expect(screen.getByText('Loading category statistics...')).toBeInTheDocument();
      expect(screen.queryByText('Category Statistics')).not.toBeInTheDocument();
    });

    test('has correct loading class', () => {
      render(<CategoryStatsTable categoryStats={[]} loading={true} />);

      expect(document.querySelector('.category-stats-table.loading')).toBeInTheDocument();
    });
  });

  describe('Empty Data Handling', () => {
    test('renders table structure even with empty data', () => {
      render(<CategoryStatsTable categoryStats={mockEmptyStats} />);

      expect(screen.getByText('Category Statistics')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();

      // Should have header but no data rows
      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles zero average score correctly', () => {
      render(<CategoryStatsTable categoryStats={mockStatsWithZeroScore} />);

      expect(screen.getByText('No Score Category')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // count
      expect(screen.getByText('0')).toBeInTheDocument(); // manually scored
      expect(screen.getByText('-')).toBeInTheDocument(); // should show '-' for zero score
    });

    test('handles very large numbers', () => {
      const largeCategoryStats: CategoryStats[] = [
        {
          category: 'Large Category',
          count: 999999,
          manuallyScored: 888888,
          averageManualScore: 9.99,
          latestSignal: '2023-12-01T10:00:00Z'
        }
      ];

      render(<CategoryStatsTable categoryStats={largeCategoryStats} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
      expect(screen.getByText('888888')).toBeInTheDocument();
      expect(screen.getByText('10.0')).toBeInTheDocument(); // 9.99 rounds to 10.0
    });

    test('handles invalid date strings gracefully', () => {
      const invalidDateStats: CategoryStats[] = [
        {
          category: 'Invalid Date Category',
          count: 5,
          manuallyScored: 3,
          averageManualScore: 6.0,
          latestSignal: 'invalid-date-string'
        }
      ];

      // This should not crash the component
      expect(() => {
        render(<CategoryStatsTable categoryStats={invalidDateStats} />);
      }).not.toThrow();

      expect(screen.getByText('Invalid Date Category')).toBeInTheDocument();
    });

    test('handles special characters in category names', () => {
      const specialCharStats: CategoryStats[] = [
        {
          category: 'Category with "quotes" & <special> chars',
          count: 3,
          manuallyScored: 2,
          averageManualScore: 4.5,
          latestSignal: '2023-12-01T10:00:00Z'
        }
      ];

      render(<CategoryStatsTable categoryStats={specialCharStats} />);

      expect(screen.getByText('Category with "quotes" & <special> chars')).toBeInTheDocument();
    });

    test('handles very precise average scores', () => {
      const preciseScoreStats: CategoryStats[] = [
        {
          category: 'Precise Category',
          count: 7,
          manuallyScored: 4,
          averageManualScore: 7.123456789,
          latestSignal: '2023-12-01T10:00:00Z'
        }
      ];

      render(<CategoryStatsTable categoryStats={preciseScoreStats} />);

      // Should round to 1 decimal place
      expect(screen.getByText('7.1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper table structure for screen readers', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      const tableHeader = document.querySelector('.table-header');
      expect(tableHeader).toBeInTheDocument();

      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(3);
    });

    test('maintains proper heading hierarchy', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Category Statistics');
    });

    test('has semantic structure', () => {
      render(<CategoryStatsTable categoryStats={mockCategoryStats} />);

      expect(document.querySelector('.category-stats-table')).toBeInTheDocument();
      expect(document.querySelector('.category-stats')).toBeInTheDocument();
      expect(document.querySelector('.stats-table')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      const largeCategoryStats: CategoryStats[] = Array.from({ length: 100 }, (_, i) => ({
        category: `Category ${i + 1}`,
        count: i + 1,
        manuallyScored: Math.floor((i + 1) * 0.7),
        averageManualScore: (i % 10) + 1,
        latestSignal: `2023-12-01T10:${i.toString().padStart(2, '0')}:00Z`
      }));

      const startTime = performance.now();
      render(<CategoryStatsTable categoryStats={largeCategoryStats} />);
      const endTime = performance.now();

      // Rendering should be reasonably fast (less than 100ms for 100 items)
      expect(endTime - startTime).toBeLessThan(100);

      // Should still render correctly
      expect(screen.getByText('Category Statistics')).toBeInTheDocument();
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 100')).toBeInTheDocument();
    });
  });
});
