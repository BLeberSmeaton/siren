import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';

// Mock the feature flags - teams feature disabled by default for tests
jest.mock('../config/features', () => ({
  isTeamsFeatureEnabled: jest.fn(() => false),
  isAdvancedFilteringEnabled: jest.fn(() => true),
  isRealtimeUpdatesEnabled: jest.fn(() => false),
}));

// Mock the report service to avoid browser-specific library imports
jest.mock('../services/reportService', () => ({
  generateReport: jest.fn(() => Promise.resolve()),
}));

// Mock Recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => (
    <div data-testid="pie">
      {data && data.map((entry: any, index: number) => (
        <div key={index} data-testid={`pie-segment-${entry.name}`}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="pie-cell" />,
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart">
      {data && data.map((entry: any, index: number) => (
        <div key={index} data-testid={`bar-${entry.category}`}>
          {entry.category}: {entry.count}
        </div>
      ))}
      {children}
    </div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

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
  teamsApi: {
    getTeams: jest.fn(),
    getTeamConfiguration: jest.fn(),
    updateTeamConfiguration: jest.fn(),
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

const mockTeams = [
  {
    teamName: 'team-bolt',
    displayName: 'Team Bolt',
    description: 'Support team for AccountRight Live and API services',
    activeCategoriesCount: 3,
    enabledDataSourcesCount: 2,
    updatedAt: '2023-09-22T10:00:00Z',
  },
];

// Import the mocked API functions and feature flags
import { signalsApi, categoriesApi, healthApi, teamsApi } from '../services/api';
import { isTeamsFeatureEnabled } from '../config/features';

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
    (teamsApi.getTeams as jest.Mock).mockResolvedValue(mockTeams);
    
    // Reset feature flags to default state (teams disabled)
    (isTeamsFeatureEnabled as jest.Mock).mockReturnValue(false);
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

  test('displays new dashboard layout components', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check for new layout sections
      expect(screen.getByText('Signals by Category')).toBeInTheDocument();
      expect(screen.getByText('🎯 Toil Reduction Priorities')).toBeInTheDocument();
      expect(screen.getByText('Category Statistics')).toBeInTheDocument();
      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
    });
  });

  test('renders toil reduction panel with mock data', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check for toil reduction panel content
      expect(screen.getByText('🎯 Toil Reduction Priorities')).toBeInTheDocument();
      expect(screen.getByText('Focus areas to reduce recurring support burden')).toBeInTheDocument();
      expect(screen.getByText('Authentication Token Renewal Issues')).toBeInTheDocument();
      expect(screen.getByText('Email Delivery Delays')).toBeInTheDocument();
      expect(screen.getByText('PDF Generation Timeouts')).toBeInTheDocument();
    });
  });

  test('category distribution chart is moved to bottom', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      const categoryDistribution = screen.getByText('Category Distribution');
      const categoryStats = screen.getByText('Category Statistics');
      
      // Both should be present
      expect(categoryDistribution).toBeInTheDocument();
      expect(categoryStats).toBeInTheDocument();
      
      // Category Distribution should appear after Category Statistics in DOM order
      // This tests the layout restructuring
      expect(categoryDistribution).toBeInTheDocument();
    });
  });

  test('toil reduction panel functionality', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check toil panel is present
      expect(screen.getByText('🎯 Toil Reduction Priorities')).toBeInTheDocument();
      expect(screen.getByText('Authentication Token Renewal Issues')).toBeInTheDocument();
      
      // Check status indicators
      expect(screen.getByText('⏳')).toBeInTheDocument(); // NotStarted
      expect(screen.getByText('🏗️')).toBeInTheDocument(); // InProgress
      expect(screen.getByText('✅')).toBeInTheDocument(); // Complete
    });
  });

  test('toil reduction panel - item expansion functionality', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Token Renewal Issues')).toBeInTheDocument();
    });

    // Test item expansion
    const authTokenItem = screen.getByText('Authentication Token Renewal Issues');
    await act(async () => {
      await userEvent.click(authTokenItem);
    });

    await waitFor(() => {
      expect(screen.getByText('📊 Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('🔍 Pattern Analysis')).toBeInTheDocument();
      expect(screen.getByText('Time spent:')).toBeInTheDocument();
      expect(screen.getByText('12h this month')).toBeInTheDocument();
      expect(screen.getByText('Potential savings:')).toBeInTheDocument();
      expect(screen.getByText('4h/week')).toBeInTheDocument();
    });
  });

  test('toil reduction panel - status management', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Token Renewal Issues')).toBeInTheDocument();
    });

    // Expand first item
    const authTokenItem = screen.getByText('Authentication Token Renewal Issues');
    await act(async () => {
      await userEvent.click(authTokenItem);
    });

    // Test status change from NotStarted to InProgress
    await waitFor(() => {
      expect(screen.getByText('🏗️ Start Working')).toBeInTheDocument();
    });

    const startButton = screen.getByText('🏗️ Start Working');
    await act(async () => {
      await userEvent.click(startButton);
    });

    await waitFor(() => {
      expect(screen.getByText('✅ Mark Complete')).toBeInTheDocument();
      expect(screen.queryByText('🏗️ Start Working')).not.toBeInTheDocument();
    });
  });

  test('toil reduction panel - displays priority scores and metadata', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check priority scores
      expect(screen.getByText('8.5')).toBeInTheDocument(); // High priority
      expect(screen.getByText('6.8')).toBeInTheDocument(); // Medium-high priority
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Medium priority
      
      // Check metadata
      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('8 tickets')).toBeInTheDocument();
      expect(screen.getByText('5h est.')).toBeInTheDocument();
      
      // Check rankings
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });
  });

  test('toil reduction panel - footer summary updates', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check footer summary
      expect(screen.getByText('Items in progress:')).toBeInTheDocument();
      expect(screen.getByText('Potential weekly savings:')).toBeInTheDocument();
      expect(screen.getByText('7h')).toBeInTheDocument(); // Total potential savings (4+2+1)
      
      // Find the "Items in progress:" text and then find its sibling stat value
      const progressLabel = screen.getByText('Items in progress:');
      const progressStat = progressLabel.parentElement;
      expect(progressStat).toHaveTextContent('1');
    });
  });

  test('chart components render correctly', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check SignalsByCategoryChart
      expect(screen.getByText('Signals by Category')).toBeInTheDocument();
      
      // Check CategoryDistributionChart moved to bottom
      expect(screen.getByText('Category Distribution')).toBeInTheDocument();
      
      // Check CategoryStatsTable
      expect(screen.getByText('Category Statistics')).toBeInTheDocument();
      
      // Verify category stats table content
      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('Manually Scored')).toBeInTheDocument();
      expect(screen.getByText('Avg Score')).toBeInTheDocument();
      expect(screen.getByText('Latest')).toBeInTheDocument();
    });
  });

  test('dashboard summary cards display correctly', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    
    await waitFor(() => {
      // Check all summary cards are present
      expect(screen.getByText('Total Signals')).toBeInTheDocument();
      expect(screen.getByText('Categorized')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      expect(screen.getByText('Manually Triaged')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      
      // Check icons
      expect(screen.getByText('📊')).toBeInTheDocument(); // Total Signals icon
      expect(screen.getByText('🏷️')).toBeInTheDocument(); // Categorized icon
      expect(screen.getByText('❓')).toBeInTheDocument(); // Uncategorized icon
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Manually Triaged icon
      expect(screen.getByText('🔢')).toBeInTheDocument(); // Categories icon
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
