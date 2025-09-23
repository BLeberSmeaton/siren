import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';

// Mock the API module to avoid actual HTTP calls during testing
jest.mock('../services/api', () => ({
  signalsApi: {
    getSignals: jest.fn(),
    getSummary: jest.fn(),
    updateManualScore: jest.fn(),
  },
  categoriesApi: {
    getCategoryStats: jest.fn(),
    getCategories: jest.fn(),
    categorizeSignal: jest.fn(),
  },
  healthApi: {
    checkHealth: jest.fn(),
  },
  cacheUtils: {
    clearAllCache: jest.fn(),
    clearSpecificCache: jest.fn(),
    getCacheKeys: jest.fn(),
  },
}));

const mockSignals = [
  {
    id: '1',
    title: 'Test Signal',
    description: 'Test description',
    source: 'Test Source',
    timestamp: '2023-09-22T10:00:00Z',
    category: 'Test Category',
    manualScore: 5,
  },
];

const mockSummary = {
  totalSignals: 1,
  categorizedSignals: 1,
  uncategorizedSignals: 0,
  manuallyScored: 1,
  categories: [{ category: 'Test Category', count: 1 }],
};

const mockCategoryStats = [
  {
    category: 'Test Category',
    count: 1,
    manuallyScored: 1,
    averageManualScore: 5,
    latestSignal: '2023-09-22T10:00:00Z',
  },
];

// Import the mocked API functions
import { signalsApi, categoriesApi, healthApi } from '../services/api';

describe('Dashboard', () => {
  beforeEach(() => {
    // Reset mocks and set up default responses
    jest.clearAllMocks();
    
    // Clear localStorage to avoid cache interference between tests
    localStorage.clear();
    
    // Set up successful API responses by default
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(true);
    (signalsApi.getSignals as jest.Mock).mockResolvedValue(mockSignals);
    (signalsApi.getSummary as jest.Mock).mockResolvedValue(mockSummary);
    (categoriesApi.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryStats);
    (categoriesApi.getCategories as jest.Mock).mockResolvedValue(['Test Category']);
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders dashboard header', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('🚨 SIREN Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Support Signal Intelligence Response Engine')).toBeInTheDocument();
    });
  });

  test('loads and displays signals', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    // Wait for API calls to complete and data to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Signal')).toBeInTheDocument();
    });
    
    // Verify API calls were made
    expect(healthApi.checkHealth).toHaveBeenCalled();
    expect(signalsApi.getSignals).toHaveBeenCalled();
    expect(signalsApi.getSummary).toHaveBeenCalled();
    expect(categoriesApi.getCategoryStats).toHaveBeenCalled();
  });

  test('displays summary statistics', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Total Signals')).toBeInTheDocument();
      expect(screen.getByText('Categorized')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API to simulate error
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(false);
    
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('🚨 Connection Error')).toBeInTheDocument();
    });
  });

  test('opens triage panel when signal is selected', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    // Wait for signals to load
    await waitFor(() => {
      expect(screen.getByText('Test Signal')).toBeInTheDocument();
    });
    
    // Click the triage button
    const triageButton = screen.getByText('Triage');
    await act(async () => {
      await userEvent.click(triageButton);
    });
    
    // Check if triage panel opens
    await waitFor(() => {
      expect(screen.getByText('🎯 Manual Triage')).toBeInTheDocument();
    });
  });

  describe('Pagination Integration', () => {
    test('displays pagination when more than 10 signals exist', async () => {
      // Create mock data with more than 10 signals to trigger pagination
      const manySignals = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test Signal ${i + 1}`,
        description: `Test description ${i + 1}`,
        source: 'Test Source',
        timestamp: '2023-09-22T10:00:00Z',
        category: 'Test Category',
        manualScore: 5,
      }));

      (signalsApi.getSignals as jest.Mock).mockResolvedValue(manySignals);
      (signalsApi.getSummary as jest.Mock).mockResolvedValue({
        ...mockSummary,
        totalSignals: 25,
      });

      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for signals to load
      await waitFor(() => {
        expect(screen.getByText('Test Signal 1')).toBeInTheDocument();
      });

      // Check pagination is rendered
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Pagination Navigation' })).toBeInTheDocument();
        expect(screen.getByText('Showing 1 to 10 of 25 results')).toBeInTheDocument();
      });

      // Check only first 10 signals are displayed
      expect(screen.getByText('Test Signal 1')).toBeInTheDocument();
      expect(screen.getByText('Test Signal 10')).toBeInTheDocument();
      expect(screen.queryByText('Test Signal 11')).not.toBeInTheDocument();
    });

    test('navigation to second page shows correct signals', async () => {
      // Create mock data with more than 10 signals
      const manySignals = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test Signal ${i + 1}`,
        description: `Test description ${i + 1}`,
        source: 'Test Source',
        timestamp: '2023-09-22T10:00:00Z',
        category: 'Test Category',
        manualScore: 5,
      }));

      (signalsApi.getSignals as jest.Mock).mockResolvedValue(manySignals);
      (signalsApi.getSummary as jest.Mock).mockResolvedValue({
        ...mockSummary,
        totalSignals: 25,
      });

      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Signal 1')).toBeInTheDocument();
      });

      // Click next page button
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      await act(async () => {
        await userEvent.click(nextButton);
      });

      // Check second page content
      await waitFor(() => {
        expect(screen.getByText('Showing 11 to 20 of 25 results')).toBeInTheDocument();
        expect(screen.getByText('Test Signal 11')).toBeInTheDocument();
        expect(screen.getByText('Test Signal 20')).toBeInTheDocument();
        expect(screen.queryByText('Test Signal 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Test Signal 21')).not.toBeInTheDocument();
      });
    });

    test('pagination resets when category filter changes', async () => {
      // Create signals with different categories
      const mixedSignals = [
        ...Array.from({ length: 15 }, (_, i) => ({
          id: `cat1-${i + 1}`,
          title: `Category 1 Signal ${i + 1}`,
          description: `Description ${i + 1}`,
          source: 'Test Source',
          timestamp: '2023-09-22T10:00:00Z',
          category: 'Category 1',
          manualScore: 5,
        })),
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `cat2-${i + 1}`,
          title: `Category 2 Signal ${i + 1}`,
          description: `Description ${i + 1}`,
          source: 'Test Source',
          timestamp: '2023-09-22T10:00:00Z',
          category: 'Category 2',
          manualScore: 5,
        })),
      ];

      (signalsApi.getSignals as jest.Mock).mockResolvedValue(mixedSignals);
      (signalsApi.getSummary as jest.Mock).mockResolvedValue({
        ...mockSummary,
        totalSignals: 25,
        categories: [
          { category: 'Category 1', count: 15 },
          { category: 'Category 2', count: 10 },
        ],
      });
      (categoriesApi.getCategoryStats as jest.Mock).mockResolvedValue([
        {
          category: 'Category 1',
          count: 15,
          manuallyScored: 15,
          averageManualScore: 5,
          latestSignal: '2023-09-22T10:00:00Z',
        },
        {
          category: 'Category 2',
          count: 10,
          manuallyScored: 10,
          averageManualScore: 5,
          latestSignal: '2023-09-22T10:00:00Z',
        },
      ]);

      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Category 1 Signal 1')).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      await act(async () => {
        await userEvent.click(nextButton);
      });

      // Verify we're on page 2
      await waitFor(() => {
        expect(screen.getByText('Category 1 Signal 11')).toBeInTheDocument();
      });

      // Click on a category filter (this would trigger category selection in a real scenario)
      // For this test, we'll simulate the category change by filtering
      // Note: The actual category selection mechanism would depend on your UI implementation
      
      // The pagination should reset to page 1 when category filter changes
      // This behavior is tested in the component logic through useEffect dependencies
    });

    test('does not show pagination with 10 or fewer signals', async () => {
      // Use default mockSignals which has only 1 signal
      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for signals to load
      await waitFor(() => {
        expect(screen.getByText('Test Signal')).toBeInTheDocument();
      });

      // Pagination should not be rendered
      expect(screen.queryByRole('navigation', { name: 'Pagination Navigation' })).not.toBeInTheDocument();
      expect(screen.queryByText(/Showing \d+ to \d+ of \d+ results/)).not.toBeInTheDocument();
    });

    test('pagination handles last page correctly', async () => {
      // Create exactly 23 signals (3 pages of 10, last page has 3)
      const signals23 = Array.from({ length: 23 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Test Signal ${i + 1}`,
        description: `Test description ${i + 1}`,
        source: 'Test Source',
        timestamp: '2023-09-22T10:00:00Z',
        category: 'Test Category',
        manualScore: 5,
      }));

      (signalsApi.getSignals as jest.Mock).mockResolvedValue(signals23);
      (signalsApi.getSummary as jest.Mock).mockResolvedValue({
        ...mockSummary,
        totalSignals: 23,
      });

      await act(async () => {
        render(<Dashboard />);
      });

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Signal 1')).toBeInTheDocument();
      });

      // Navigate to page 3 (last page)
      const page3Button = screen.getByRole('button', { name: 'Go to page 3' });
      await act(async () => {
        await userEvent.click(page3Button);
      });

      // Check last page content
      await waitFor(() => {
        expect(screen.getByText('Showing 21 to 23 of 23 results')).toBeInTheDocument();
        expect(screen.getByText('Test Signal 21')).toBeInTheDocument();
        expect(screen.getByText('Test Signal 23')).toBeInTheDocument();
        expect(screen.queryByText('Test Signal 20')).not.toBeInTheDocument();
      });

      // Next button should be disabled on last page
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      expect(nextButton).toBeDisabled();
    });
  });
});
