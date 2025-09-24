import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardSummary from '../DashboardSummary';
import { SignalSummary, CategoryStats } from '../../types';


const mockSummary: SignalSummary = {
  totalSignals: 100,
  categorizedSignals: 85,
  uncategorizedSignals: 15,
  manuallyScored: 45,
  categories: [
    { category: 'Bug Report', count: 30 },
    { category: 'Feature Request', count: 25 },
    { category: 'Support Question', count: 30 }
  ]
};

const mockCategoryStats: CategoryStats[] = [
  {
    category: 'Bug Report',
    count: 30,
    manuallyScored: 20,
    averageManualScore: 7.5,
    latestSignal: '2023-12-01T10:00:00Z'
  },
  {
    category: 'Feature Request',
    count: 25,
    manuallyScored: 15,
    averageManualScore: 6.2,
    latestSignal: '2023-11-30T14:00:00Z'
  },
  {
    category: 'Support Question',
    count: 30,
    manuallyScored: 25,
    averageManualScore: 5.8,
    latestSignal: '2023-12-02T09:00:00Z'
  }
];

describe('DashboardSummary', () => {
  describe('Rendering with Data', () => {
    test('renders summary cards with correct values', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      // Check that all summary cards are present
      expect(screen.getByText('Total Signals')).toBeInTheDocument();
      expect(screen.getByText('Categorized')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      expect(screen.getByText('Manually Triaged')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();

      // Check that values are correctly displayed
      expect(screen.getByText('100')).toBeInTheDocument(); // Total signals
      expect(screen.getByText('85')).toBeInTheDocument();  // Categorized
      expect(screen.getByText('15')).toBeInTheDocument();  // Uncategorized
      expect(screen.getByText('45')).toBeInTheDocument();  // Manually scored
      expect(screen.getByText('3')).toBeInTheDocument();   // Categories count
    });

    test('displays correct card structure', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      const summaryCards = document.querySelectorAll('.summary-card');
      expect(summaryCards).toHaveLength(5);

      // Check card classes
      expect(document.querySelector('.summary-card.primary')).toBeInTheDocument();
      expect(document.querySelector('.summary-card.success')).toBeInTheDocument();
      expect(document.querySelector('.summary-card.warning')).toBeInTheDocument();
      expect(document.querySelector('.summary-card.info')).toBeInTheDocument();
      expect(document.querySelector('.summary-card.secondary')).toBeInTheDocument();
    });

    test('displays correct icons', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      expect(screen.getByText('📊')).toBeInTheDocument(); // Total signals icon
      expect(screen.getByText('🏷️')).toBeInTheDocument(); // Categorized icon
      expect(screen.getByText('❓')).toBeInTheDocument(); // Uncategorized icon
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Manually triaged icon
      expect(screen.getByText('🔢')).toBeInTheDocument(); // Categories icon
    });
  });

  describe('Loading State', () => {
    test('displays loading message when loading is true', () => {
      render(
        <DashboardSummary 
          summary={null} 
          categoryStats={[]} 
          loading={true} 
        />
      );

      expect(screen.getByText('Loading dashboard summary...')).toBeInTheDocument();
      expect(screen.queryByText('Total Signals')).not.toBeInTheDocument();
    });

    test('has correct loading class', () => {
      render(
        <DashboardSummary 
          summary={null} 
          categoryStats={[]} 
          loading={true} 
        />
      );

      expect(document.querySelector('.dashboard-summary.loading')).toBeInTheDocument();
    });
  });

  describe('Null Summary Handling', () => {
    test('displays loading message when summary is null', () => {
      render(
        <DashboardSummary 
          summary={null} 
          categoryStats={mockCategoryStats} 
        />
      );

      expect(screen.getByText('Loading dashboard summary...')).toBeInTheDocument();
      expect(screen.queryByText('Total Signals')).not.toBeInTheDocument();
    });
  });

  describe('Empty Categories', () => {
    test('handles summary with no categories', () => {
      const emptyCategoriesSummary: SignalSummary = {
        ...mockSummary,
        categories: []
      };

      render(
        <DashboardSummary 
          summary={emptyCategoriesSummary} 
          categoryStats={[]} 
        />
      );

      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 categories
    });
  });

  describe('Edge Cases', () => {
    test('handles zero values correctly', () => {
      const zeroValuesSummary: SignalSummary = {
        totalSignals: 0,
        categorizedSignals: 0,
        uncategorizedSignals: 0,
        manuallyScored: 0,
        categories: []
      };

      render(
        <DashboardSummary 
          summary={zeroValuesSummary} 
          categoryStats={[]} 
        />
      );

      // All values should be 0
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(5); // At least 5 cards with 0
    });

    test('handles large numbers correctly', () => {
      const largeNumbersSummary: SignalSummary = {
        totalSignals: 999999,
        categorizedSignals: 888888,
        uncategorizedSignals: 111111,
        manuallyScored: 555555,
        categories: [
          { category: 'Category 1', count: 100000 },
          { category: 'Category 2', count: 200000 }
        ]
      };

      render(
        <DashboardSummary 
          summary={largeNumbersSummary} 
          categoryStats={[]} 
        />
      );

      expect(screen.getByText('999,999')).toBeInTheDocument();
      expect(screen.getByText('888,888')).toBeInTheDocument();
      expect(screen.getByText('111,111')).toBeInTheDocument();
      expect(screen.getByText('555,555')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 categories
    });
  });

  describe('Accessibility', () => {
    test('has proper structure for screen readers', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      const dashboardSummary = document.querySelector('.dashboard-summary');
      expect(dashboardSummary).toBeInTheDocument();

      const summaryCards = document.querySelector('.summary-cards');
      expect(summaryCards).toBeInTheDocument();
      
      // Check for semantic heading
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      const heading = document.querySelector('h2');
      expect(heading).toHaveTextContent('Dashboard Overview');
    });

    test('card content is properly structured', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      const cardContents = document.querySelectorAll('.card-content');
      expect(cardContents).toHaveLength(5);

      cardContents.forEach(cardContent => {
        expect(cardContent.querySelector('.card-number')).toBeInTheDocument();
        expect(cardContent.querySelector('.card-label')).toBeInTheDocument();
      });
    });

    test('has proper ARIA labels and roles', () => {
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );

      // Check main container has proper aria-label
      const summaryCards = document.querySelector('.summary-cards');
      expect(summaryCards).toHaveAttribute('aria-label', 'Dashboard summary statistics');
      
      // Check cards have proper ARIA structure
      const cards = document.querySelectorAll('.summary-card');
      expect(cards).toHaveLength(5);
      
      cards.forEach(card => {
        expect(card).toHaveAttribute('role', 'region');
        expect(card).toHaveAttribute('aria-labelledby');
      });

      // Check icons are hidden from screen readers
      const icons = document.querySelectorAll('.card-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Performance', () => {
    test('renders efficiently', () => {
      const startTime = performance.now();
      render(
        <DashboardSummary 
          summary={mockSummary} 
          categoryStats={mockCategoryStats} 
        />
      );
      const endTime = performance.now();

      // Should render very quickly (less than 50ms)
      expect(endTime - startTime).toBeLessThan(50);
      
      // Should still render all cards
      expect(document.querySelectorAll('.summary-card')).toHaveLength(5);
    });
  });
});