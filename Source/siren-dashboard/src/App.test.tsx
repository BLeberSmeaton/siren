import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock the feature flags - teams feature disabled by default for tests
jest.mock('./config/features', () => ({
  isTeamsFeatureEnabled: jest.fn(() => false),
  isAdvancedFilteringEnabled: jest.fn(() => true),
  isRealtimeUpdatesEnabled: jest.fn(() => false),
}));

// Mock the report service to avoid browser-specific library imports
jest.mock('./services/reportService', () => ({
  generateReport: jest.fn(() => Promise.resolve()),
}));

// Mock the API module to avoid actual HTTP calls during testing
jest.mock('./services/api', () => ({
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

// Import the mocked API functions
import { signalsApi, categoriesApi, healthApi, teamsApi } from './services/api';

describe('App', () => {
  beforeEach(() => {
    // Reset mocks and set up default responses
    jest.clearAllMocks();
    
    // Clear localStorage to avoid cache interference between tests
    localStorage.clear();
    
    // Set up successful API responses by default
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(true);
    (signalsApi.getSignals as jest.Mock).mockResolvedValue([]);
    (signalsApi.getSummary as jest.Mock).mockResolvedValue({
      totalSignals: 0,
      categorizedSignals: 0,
      uncategorizedSignals: 0,
      manuallyScored: 0,
      categories: [],
    });
    (categoriesApi.getCategoryStats as jest.Mock).mockResolvedValue([]);
    (categoriesApi.getCategories as jest.Mock).mockResolvedValue([]);
    (teamsApi.getTeams as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders SIREN dashboard', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Wait for the dashboard to load and check for the main header
    await waitFor(() => {
      expect(screen.getByText('🚨 SIREN Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Support Signal Intelligence Response Engine')).toBeInTheDocument();
    });
  });
});
