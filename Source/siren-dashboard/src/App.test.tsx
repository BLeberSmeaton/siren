import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

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
}));

// Import the mocked API functions
import { signalsApi, categoriesApi, healthApi } from './services/api';

describe('App', () => {
  beforeEach(() => {
    // Reset mocks and set up default responses
    jest.clearAllMocks();
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
  });

  test('renders SIREN dashboard', async () => {
    render(<App />);
    
    // Wait for the dashboard to load and check for the main header
    await waitFor(() => {
      expect(screen.getByText('🚨 SIREN Dashboard')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Support Signal Intelligence Response Engine')).toBeInTheDocument();
  });
});
