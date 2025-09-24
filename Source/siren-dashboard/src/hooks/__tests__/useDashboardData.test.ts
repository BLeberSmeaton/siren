import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboardData } from '../useDashboardData';
import { signalsApi, categoriesApi, healthApi, teamsApi } from '../../services/api';
import { isTeamsFeatureEnabled } from '../../config/features';

// Mock the API module
jest.mock('../../services/api', () => ({
  signalsApi: {
    getSignals: jest.fn(),
    getSummary: jest.fn(),
  },
  categoriesApi: {
    getCategoryStats: jest.fn(),
  },
  healthApi: {
    checkHealth: jest.fn(),
  },
  teamsApi: {
    getTeams: jest.fn(),
  },
}));

// Mock feature flags
jest.mock('../../config/features', () => ({
  isTeamsFeatureEnabled: jest.fn(),
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

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Set up default successful API responses
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(true);
    (signalsApi.getSignals as jest.Mock).mockResolvedValue(mockSignals);
    (signalsApi.getSummary as jest.Mock).mockResolvedValue(mockSummary);
    (categoriesApi.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryStats);
    (teamsApi.getTeams as jest.Mock).mockResolvedValue(mockTeams);
    (isTeamsFeatureEnabled as jest.Mock).mockReturnValue(false);
  });

  test('loads dashboard data successfully', async () => {
    const { result } = renderHook(() => useDashboardData());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that data was loaded correctly
    expect(result.current.signals).toEqual(mockSignals);
    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.categoryStats).toEqual(mockCategoryStats);
    expect(result.current.teams).toEqual([]);
    expect(result.current.error).toBeNull();

    // Verify API calls were made
    expect(healthApi.checkHealth).toHaveBeenCalled();
    expect(signalsApi.getSignals).toHaveBeenCalledWith(false);
    expect(signalsApi.getSummary).toHaveBeenCalledWith(false);
    expect(categoriesApi.getCategoryStats).toHaveBeenCalledWith(false);
  });

  test('loads teams data when teams feature is enabled', async () => {
    (isTeamsFeatureEnabled as jest.Mock).mockReturnValue(true);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.teams).toEqual(mockTeams);
    expect(teamsApi.getTeams).toHaveBeenCalledWith(false);
  });

  test('handles API health check failure', async () => {
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API is not responding. Please ensure the SIREN.API server is running.');
    expect(result.current.signals).toEqual([]);
  });

  test('handles API errors gracefully', async () => {
    const errorMessage = 'Network error';
    (signalsApi.getSignals as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.signals).toEqual([]);
  });

  test('loadDashboardData can be called manually with forceRefresh', async () => {
    const { result } = renderHook(() => useDashboardData());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call loadDashboardData with forceRefresh
    await act(async () => {
      await result.current.loadDashboardData(true);
    });

    expect(signalsApi.getSignals).toHaveBeenCalledWith(true);
    expect(signalsApi.getSummary).toHaveBeenCalledWith(true);
    expect(categoriesApi.getCategoryStats).toHaveBeenCalledWith(true);
  });

  test('updateSignal updates the signals array', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedSignal = { ...mockSignals[0], title: 'Updated Signal' };

    act(() => {
      result.current.updateSignal(updatedSignal);
    });

    expect(result.current.signals[0].title).toBe('Updated Signal');
  });

  test('refreshSummaryData refreshes summary and category stats', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refreshSummaryData();
    });

    expect(signalsApi.getSummary).toHaveBeenCalledWith(true);
    expect(categoriesApi.getCategoryStats).toHaveBeenCalledWith(true);
    // Should not reload signals
    expect(signalsApi.getSignals).not.toHaveBeenCalled();
  });

  test('refreshSummaryData falls back to full reload on error', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock summary refresh to fail
    (signalsApi.getSummary as jest.Mock).mockRejectedValue(new Error('Summary error'));

    // Clear previous calls
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refreshSummaryData();
    });

    // Should fallback to loading all data
    expect(signalsApi.getSignals).toHaveBeenCalled();
  });
});
