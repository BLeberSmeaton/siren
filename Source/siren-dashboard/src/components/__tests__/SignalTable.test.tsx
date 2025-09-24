import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignalTable from '../SignalTable';
import { SupportSignal } from '../../types';

// Mock the Pagination component to avoid complex rendering issues in tests
jest.mock('../Pagination', () => {
  return function MockPagination({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems, 
    itemsPerPage, 
    showingStart, 
    showingEnd 
  }: any) {
    return (
      <div data-testid="pagination">
        <span data-testid="pagination-info">
          Showing {showingStart}-{showingEnd} of {totalItems} items
        </span>
        <button 
          data-testid="page-prev" 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span data-testid="current-page">{currentPage}</span>
        <span data-testid="total-pages">/{totalPages}</span>
        <button 
          data-testid="page-next" 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };
});

const mockSignals: SupportSignal[] = [
  {
    id: '1',
    title: 'API Gateway Timeout Error',
    description: 'Users experiencing timeout errors when accessing API endpoints',
    source: 'Jira',
    timestamp: '2023-12-01T10:00:00Z',
    category: 'API Issues',
    manualScore: 8.5
  },
  {
    id: '2',
    title: 'Database Connection Pool Exhausted',
    description: 'Application unable to acquire database connections',
    source: 'Monitoring',
    timestamp: '2023-12-02T09:30:00Z',
    category: 'Database Issues',
    manualScore: 9.2
  },
  {
    id: '3',
    title: 'SSL Certificate Expiring Soon',
    description: 'SSL certificate for main domain expires in 7 days',
    source: 'Security Scan',
    timestamp: '2023-12-03T08:15:00Z',
    category: 'Certificate Issues',
    manualScore: 7.0
  },
  {
    id: '4',
    title: 'Memory Leak in User Service',
    description: 'Progressive memory consumption in user authentication service',
    source: 'APM',
    timestamp: '2023-12-04T07:45:00Z',
    category: 'Performance',
    manualScore: 6.8
  },
  {
    id: '5',
    title: 'Login Issues After Update',
    description: 'Multiple users reporting login failures after latest deployment',
    source: 'Support Tickets',
    timestamp: '2023-12-05T07:00:00Z',
    category: 'Authentication',
    manualScore: 8.0
  }
];

const mockSignalsLargeSet: SupportSignal[] = Array.from({ length: 25 }, (_, i) => ({
  id: `signal-${i + 1}`,
  title: `Test Signal ${i + 1}`,
  description: `Description for test signal ${i + 1}`,
  source: `Source ${(i % 3) + 1}`,
  timestamp: `2023-12-${String((i % 30) + 1).padStart(2, '0')}T10:00:00Z`,
  category: i % 2 === 0 ? 'Bug Report' : 'Feature Request',
  manualScore: Math.random() * 10
}));

const mockUncategorizedSignals: SupportSignal[] = [
  {
    id: '6',
    title: 'Uncategorized Signal 1',
    description: 'A signal without category',
    source: 'Unknown',
    timestamp: '2023-12-01T06:00:00Z',
    // No category or manualScore
  },
  {
    id: '7',
    title: 'Uncategorized Signal 2',
    description: 'Another signal without category',
    source: 'Manual Entry',
    timestamp: '2023-12-01T05:30:00Z',
    category: undefined,
    manualScore: undefined
  }
];

const mockOnSignalSelect = jest.fn();

describe('SignalTable', () => {
  beforeEach(() => {
    mockOnSignalSelect.mockClear();
  });

  describe('Rendering with Data', () => {
    test('renders table header correctly', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText('Support Signals')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('renders signal data correctly', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Check signal titles are displayed
      expect(screen.getByText('API Gateway Timeout Error')).toBeInTheDocument();
      expect(screen.getByText('Database Connection Pool Exhausted')).toBeInTheDocument();
      expect(screen.getByText('SSL Certificate Expiring Soon')).toBeInTheDocument();

      // Check categories are displayed with badges
      expect(screen.getByText('API Issues')).toBeInTheDocument();
      expect(screen.getByText('Database Issues')).toBeInTheDocument();
      expect(screen.getByText('Certificate Issues')).toBeInTheDocument();

      // Check sources are displayed
      expect(screen.getByText('Jira')).toBeInTheDocument();
      expect(screen.getByText('Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Security Scan')).toBeInTheDocument();

      // Check scores are formatted correctly
      expect(screen.getByText('8.5')).toBeInTheDocument();
      expect(screen.getByText('9.2')).toBeInTheDocument();
      expect(screen.getByText('7.0')).toBeInTheDocument();
    });

    test('renders triage buttons for each signal', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const triageButtons = screen.getAllByText('Triage');
      expect(triageButtons).toHaveLength(5); // One for each mock signal
      
      triageButtons.forEach(button => {
        expect(button).toHaveClass('action-button', 'primary');
      });
    });

    test('displays correct signal count information', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText('Showing 1-5 of 5 signals')).toBeInTheDocument();
    });

    test('formats dates correctly', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Check that dates are formatted as locale date strings
      const expectedDate1 = new Date('2023-12-01T10:00:00Z').toLocaleDateString();
      const expectedDate2 = new Date('2023-12-02T09:30:00Z').toLocaleDateString();
      expect(screen.getByText(expectedDate1)).toBeInTheDocument();
      expect(screen.getByText(expectedDate2)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('displays loading message when loading is true', () => {
      render(
        <SignalTable 
          signals={[]} 
          onSignalSelect={mockOnSignalSelect}
          loading={true}
        />
      );

      expect(screen.getByText('Loading signals...')).toBeInTheDocument();
      expect(screen.queryByText('Support Signals')).not.toBeInTheDocument();
    });

    test('has correct loading structure', () => {
      render(
        <SignalTable 
          signals={[]} 
          onSignalSelect={mockOnSignalSelect}
          loading={true}
        />
      );

      const loadingDiv = document.querySelector('.loading');
      expect(loadingDiv).toBeInTheDocument();
      expect(loadingDiv).toHaveTextContent('Loading signals...');
    });
  });

  describe('Empty Data Handling', () => {
    test('renders table structure even with empty data', () => {
      render(
        <SignalTable 
          signals={[]} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText('Support Signals')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('No signals found')).toBeInTheDocument();

      // Should have header but no data rows
      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(0);
    });

    test('does not render pagination for empty data', () => {
      render(
        <SignalTable 
          signals={[]} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    test('filters signals by selected category', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
          selectedCategory="API Issues"
        />
      );

      // Should only show API Issues signal
      expect(screen.getByText('API Gateway Timeout Error')).toBeInTheDocument();
      expect(screen.queryByText('Database Connection Pool Exhausted')).not.toBeInTheDocument();
      expect(screen.queryByText('SSL Certificate Expiring Soon')).not.toBeInTheDocument();

      // Should show filtered count (text is split across elements)
      expect(screen.getByText('Showing 1 of 1 signals')).toBeInTheDocument();
      expect(screen.getByText(/filtered by/)).toBeInTheDocument();
      expect(screen.getByText('API Issues')).toBeInTheDocument();
    });

    test('shows all signals when no category is selected', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
          selectedCategory={undefined}
        />
      );

      // Should show all signals
      expect(screen.getByText('API Gateway Timeout Error')).toBeInTheDocument();
      expect(screen.getByText('Database Connection Pool Exhausted')).toBeInTheDocument();
      expect(screen.getByText('SSL Certificate Expiring Soon')).toBeInTheDocument();

      // Should not show filter text
      expect(screen.queryByText(/filtered by/)).not.toBeInTheDocument();
    });

    test('handles category filter with no matching signals', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
          selectedCategory="Non-existent Category"
        />
      );

      expect(screen.getByText('No signals found')).toBeInTheDocument();
      
      // Should have no table rows
      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(0);
    });
  });

  describe('Pagination Functionality', () => {
    test('renders pagination for large datasets', () => {
      render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Should show pagination component
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      expect(screen.getByTestId('total-pages')).toHaveTextContent('/3'); // 25 signals / 10 per page = 3 pages
    });

    test('displays correct number of signals per page', () => {
      render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Should show first 10 signals (page 1)
      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(10);

      // Check pagination info
      expect(screen.getByText('Showing 1-10 of 25 signals')).toBeInTheDocument();
    });

    test('handles page navigation correctly', async () => {
      
      render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Click next page
      const nextButton = screen.getByTestId('page-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('2');
        expect(screen.getByText('Showing 11-20 of 25 signals')).toBeInTheDocument();
      });
    });

    test('resets to first page when signals change', () => {
      const { rerender } = render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Navigate to page 2
      const nextButton = screen.getByTestId('page-next');
      fireEvent.click(nextButton);

      // Change signals prop
      rerender(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Should be back to showing all signals without pagination
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1-5 of 5 signals')).toBeInTheDocument();
    });

    test('resets to first page when category filter changes', () => {
      const { rerender } = render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Navigate to page 2
      const nextButton = screen.getByTestId('page-next');
      fireEvent.click(nextButton);

      // Change category filter
      rerender(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
          selectedCategory="Bug Report"
        />
      );

      // Should reset to first page and show filtered results
      expect(screen.getByText(/filtered by Bug Report/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onSignalSelect when triage button is clicked', async () => {
      
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const firstTriageButton = screen.getAllByText('Triage')[0];
      fireEvent.click(firstTriageButton);

      expect(mockOnSignalSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSignalSelect).toHaveBeenCalledWith(mockSignals[0]);
    });

    test('calls onSignalSelect with correct signal for different buttons', async () => {
      
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const triageButtons = screen.getAllByText('Triage');
      
      // Click second triage button
      fireEvent.click(triageButtons[1]);

      expect(mockOnSignalSelect).toHaveBeenCalledWith(mockSignals[1]);
    });
  });

  describe('Score and Category Badge Styling', () => {
    test('applies correct CSS classes to category badges', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Check that category badges have correct classes
      const apiBadge = screen.getByText('API Issues').closest('.category-badge');
      const databaseBadge = screen.getByText('Database Issues').closest('.category-badge');
      const certificateBadge = screen.getByText('Certificate Issues').closest('.category-badge');

      expect(apiBadge).toHaveClass('category-badge', 'api');
      expect(databaseBadge).toHaveClass('category-badge', 'database');
      expect(certificateBadge).toHaveClass('category-badge', 'certificate');
    });

    test('applies correct CSS classes to score badges', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Check score badge classes based on score ranges
      const highScoreBadge = screen.getByText('9.2').closest('.score-badge'); // >= 8
      const mediumScoreBadge = screen.getByText('6.8').closest('.score-badge'); // >= 5, < 8
      const lowScoreBadge = screen.getByText('7.0').closest('.score-badge'); // >= 5, < 8 (actually medium)

      expect(highScoreBadge).toHaveClass('score-badge', 'high');
      expect(mediumScoreBadge).toHaveClass('score-badge', 'medium');
      expect(lowScoreBadge).toHaveClass('score-badge', 'medium');
    });

    test('handles uncategorized signals correctly', () => {
      render(
        <SignalTable 
          signals={mockUncategorizedSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Should show 'Uncategorized' for signals without category
      expect(screen.getAllByText('Uncategorized')).toHaveLength(2);
      
      // Should show '-' for signals without score
      expect(screen.getAllByText('-')).toHaveLength(2);

      // Check CSS classes
      const uncategorizedBadges = document.querySelectorAll('.category-badge.uncategorized');
      expect(uncategorizedBadges).toHaveLength(2);

      const unscuredBadges = document.querySelectorAll('.score-badge.unscored');
      expect(unscuredBadges).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    test('handles signals with very long titles', () => {
      const longTitleSignals: SupportSignal[] = [
        {
          id: '1',
          title: 'This is an extremely long signal title that should be handled gracefully by the component without breaking the layout or causing any display issues',
          description: 'Description',
          source: 'Test',
          timestamp: '2023-12-01T10:00:00Z',
          category: 'Test Category',
          manualScore: 5.0
        }
      ];

      render(
        <SignalTable 
          signals={longTitleSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText(/This is an extremely long signal title/)).toBeInTheDocument();
    });

    test('handles signals with special characters', () => {
      const specialCharSignals: SupportSignal[] = [
        {
          id: '1',
          title: 'Signal with "quotes" & <special> chars',
          description: 'Description with symbols: @#$%^&*()',
          source: 'Test Source',
          timestamp: '2023-12-01T10:00:00Z',
          category: 'Category with & symbols',
          manualScore: 7.5
        }
      ];

      render(
        <SignalTable 
          signals={specialCharSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText('Signal with "quotes" & <special> chars')).toBeInTheDocument();
      expect(screen.getByText('Category with & symbols')).toBeInTheDocument();
    });

    test('handles invalid date strings gracefully', () => {
      const invalidDateSignals: SupportSignal[] = [
        {
          id: '1',
          title: 'Invalid Date Signal',
          description: 'Description',
          source: 'Test',
          timestamp: 'invalid-date-string',
          category: 'Test',
          manualScore: 5.0
        }
      ];

      // Should not crash the component
      expect(() => {
        render(
          <SignalTable 
            signals={invalidDateSignals} 
            onSignalSelect={mockOnSignalSelect}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('Invalid Date Signal')).toBeInTheDocument();
    });

    test('handles extreme score values', () => {
      const extremeScoreSignals: SupportSignal[] = [
        {
          id: '1',
          title: 'Zero Score',
          description: 'Description',
          source: 'Test',
          timestamp: '2023-12-01T10:00:00Z',
          category: 'Test',
          manualScore: 0
        },
        {
          id: '2',
          title: 'Max Score',
          description: 'Description',
          source: 'Test',
          timestamp: '2023-12-01T10:00:00Z',
          category: 'Test',
          manualScore: 10
        },
        {
          id: '3',
          title: 'Decimal Score',
          description: 'Description',
          source: 'Test',
          timestamp: '2023-12-01T10:00:00Z',
          category: 'Test',
          manualScore: 3.14159
        }
      ];

      render(
        <SignalTable 
          signals={extremeScoreSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument(); // Zero score shows as unscored
      expect(screen.getByText('10.0')).toBeInTheDocument(); // Max score
      expect(screen.getByText('3.1')).toBeInTheDocument(); // Rounded decimal
    });

    test('handles single signal edge case', () => {
      const singleSignal = [mockSignals[0]];
      
      render(
        <SignalTable 
          signals={singleSignal} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Should show "Showing 1 of 1 signals" (not "Showing 1-1")
      expect(screen.getByText('Showing 1 of 1 signals')).toBeInTheDocument();
      
      // Should not show pagination
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper table structure for screen readers', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const tableContainer = document.querySelector('.signal-table-container');
      expect(tableContainer).toBeInTheDocument();

      const tableHeader = document.querySelector('.table-header');
      expect(tableHeader).toBeInTheDocument();

      const tableBody = document.querySelector('.table-body');
      expect(tableBody).toBeInTheDocument();
    });

    test('maintains proper heading hierarchy', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const heading = document.querySelector('h3');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Support Signals');
    });

    test('triage buttons are properly accessible', () => {
      render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const triageButtons = screen.getAllByText('Triage');
      triageButtons.forEach(button => {
        expect(button.tagName).toBe('BUTTON'); // Verify it's a button element
        expect(button).toHaveClass('action-button', 'primary');
      });
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      const largeDataset: SupportSignal[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-signal-${i}`,
        title: `Performance Test Signal ${i}`,
        description: `Description ${i}`,
        source: `Source ${i % 5}`,
        timestamp: `2023-12-01T10:${(i % 60).toString().padStart(2, '0')}:00Z`,
        category: `Category ${i % 10}`,
        manualScore: Math.random() * 10
      }));

      const startTime = performance.now();
      render(
        <SignalTable 
          signals={largeDataset} 
          onSignalSelect={mockOnSignalSelect}
        />
      );
      const endTime = performance.now();

      // Rendering should be reasonably fast (less than 200ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(200);

      // Should still only render first page (10 items)
      const tableRows = document.querySelectorAll('.table-row');
      expect(tableRows).toHaveLength(10);

      // Should show correct pagination info
      expect(screen.getByText('Showing 1-10 of 1000 signals')).toBeInTheDocument();
    });

    test('rerenders efficiently when props change', () => {
      const { rerender } = render(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Change only the category filter
      const startTime = performance.now();
      rerender(
        <SignalTable 
          signals={mockSignals} 
          onSignalSelect={mockOnSignalSelect}
          selectedCategory="API Issues"
        />
      );
      const endTime = performance.now();

      // Rerendering should be very fast
      expect(endTime - startTime).toBeLessThan(50);
      
      // Should show filtered results
      expect(screen.getByText(/filtered by API Issues/)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with Pagination component', () => {
      render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      const paginationComponent = screen.getByTestId('pagination');
      expect(paginationComponent).toBeInTheDocument();

      // Check pagination props are passed correctly
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('Showing 1-10 of 25 items');
    });

    test('maintains component state correctly across interactions', async () => {
      
      render(
        <SignalTable 
          signals={mockSignalsLargeSet} 
          onSignalSelect={mockOnSignalSelect}
        />
      );

      // Navigate to page 2
      fireEvent.click(screen.getByTestId('page-next'));
      expect(screen.getByTestId('current-page')).toHaveTextContent('2');

      // Click a triage button
      const triageButtons = screen.getAllByText('Triage');
      fireEvent.click(triageButtons[0]);

      // Page should remain the same
      expect(screen.getByTestId('current-page')).toHaveTextContent('2');
      expect(mockOnSignalSelect).toHaveBeenCalledTimes(1);
    });
  });
});
