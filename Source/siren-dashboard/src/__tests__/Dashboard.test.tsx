import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(true);
    (signalsApi.getSignals as jest.Mock).mockResolvedValue(mockSignals);
    (signalsApi.getSummary as jest.Mock).mockResolvedValue(mockSummary);
    (categoriesApi.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryStats);
    (categoriesApi.getCategories as jest.Mock).mockResolvedValue(['Test Category']);
  });

  test('renders dashboard header', async () => {
    render(<Dashboard />);
    
    // Check if the main heading is rendered
    expect(screen.getByText('🚨 SIREN Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Support Signal Intelligence Response Engine')).toBeInTheDocument();
  });

  test('loads and displays signals', async () => {
    render(<Dashboard />);
    
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
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Signals')).toBeInTheDocument();
      expect(screen.getByText('Categorized')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API to simulate error
    (healthApi.checkHealth as jest.Mock).mockResolvedValue(false);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('🚨 Connection Error')).toBeInTheDocument();
    });
  });

  test('opens triage panel when signal is selected', async () => {
    render(<Dashboard />);
    
    // Wait for signals to load
    await waitFor(() => {
      expect(screen.getByText('Test Signal')).toBeInTheDocument();
    });
    
    // Click the triage button
    const triageButton = screen.getByText('Triage');
    await userEvent.click(triageButton);
    
    // Check if triage panel opens
    await waitFor(() => {
      expect(screen.getByText('🎯 Manual Triage')).toBeInTheDocument();
    });
  });
});
