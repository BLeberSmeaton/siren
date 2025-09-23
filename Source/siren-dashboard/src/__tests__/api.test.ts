import {
  SupportSignal,
  SignalSummary,
  CategoryStats,
  TeamSummary,
  TeamConfiguration,
  ManualScoreRequest,
  CategorizeRequest
} from '../types';

// Mock axios module completely
jest.mock('axios', () => {
  // Create the mock instance inside the factory
  const mockInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  
  return {
    create: jest.fn(() => mockInstance),
    default: {
      create: jest.fn(() => mockInstance),
    }
  };
});

// Import axios to get access to the mock
import axios from 'axios';

// Now import the API module after mocking is setup
import { 
  signalsApi, 
  categoriesApi, 
  healthApi, 
  teamsApi, 
  cacheUtils 
} from '../services/api';

// Get the mocked axios and instance
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = mockedAxios.create() as jest.Mocked<any>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('API Services', () => {

  // Test data
  const mockSignals: SupportSignal[] = [
    {
      id: '1',
      title: 'Test Signal 1',
      description: 'Test description 1',
      source: 'Test Source',
      timestamp: '2023-09-22T10:00:00Z',
      category: 'Bug Report',
      manualScore: 7,
    },
    {
      id: '2',
      title: 'Test Signal 2',
      description: 'Test description 2',
      source: 'Test Source',
      timestamp: '2023-09-22T11:00:00Z',
      category: 'Feature Request',
      manualScore: 5,
    },
  ];

  const mockSummary: SignalSummary = {
    totalSignals: 2,
    categorizedSignals: 2,
    uncategorizedSignals: 0,
    manuallyScored: 2,
    categories: [
      { category: 'Bug Report', count: 1 },
      { category: 'Feature Request', count: 1 },
    ],
  };

  const mockCategoryStats: CategoryStats[] = [
    {
      category: 'Bug Report',
      count: 1,
      manuallyScored: 1,
      averageManualScore: 7,
      latestSignal: '2023-09-22T10:00:00Z',
    },
    {
      category: 'Feature Request',
      count: 1,
      manuallyScored: 1,
      averageManualScore: 5,
      latestSignal: '2023-09-22T11:00:00Z',
    },
  ];

  const mockTeams: TeamSummary[] = [
    {
      teamName: 'team-bolt',
      displayName: 'Team Bolt',
      description: 'Support team for AccountRight Live',
      activeCategoriesCount: 2,
      enabledDataSourcesCount: 1,
      updatedAt: '2023-09-22T10:00:00Z',
    },
  ];

  const mockTeamConfig: TeamConfiguration = {
    teamName: 'team-bolt',
    displayName: 'Team Bolt',
    description: 'Support team for AccountRight Live',
    categories: [
      { name: 'Bug Report', displayName: 'Bug Report', isActive: true, keywords: ['bug', 'error'], priority: 1 },
    ],
    dataSources: [
      { name: 'Jira', sourceType: 'Jira', isEnabled: true, settings: { connectionString: 'jira-connection' }, applicableCategories: [] },
    ],
    triageSettings: {
      enableManualScoring: true,
      defaultScore: 5,
      highPriorityCategories: ['Bug Report'],
      categoryDefaultScores: { 'Bug Report': 7 }
    },
    createdAt: '2023-09-20T10:00:00Z',
    updatedAt: '2023-09-22T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset axios mock responses to default success responses
    mockAxiosInstance.get.mockResolvedValue({ data: [], status: 200 });
    mockAxiosInstance.post.mockResolvedValue({ data: {}, status: 200 });
    mockAxiosInstance.put.mockResolvedValue({ data: {}, status: 200 });
    
    // Clear localStorage
    mockLocalStorage.clear();
  });

  describe('API Instance Creation', () => {
    test('API services are available', () => {
      expect(signalsApi).toBeDefined();
      expect(categoriesApi).toBeDefined();
      expect(healthApi).toBeDefined();
      expect(teamsApi).toBeDefined();
      expect(cacheUtils).toBeDefined();
    });
  });

  describe('signalsApi', () => {
    describe('getSignals', () => {
      test('makes GET request to /signals endpoint', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

        const result = await signalsApi.getSignals();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/signals');
        expect(result).toEqual(mockSignals);
      });

      test('uses cached data when available and not forcing refresh', async () => {
        const cachedData = JSON.stringify({
          data: mockSignals,
          timestamp: Date.now() - 60000, // 1 minute ago
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await signalsApi.getSignals();

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockSignals);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('siren_signals');
      });

      test('ignores expired cache', async () => {
        const expiredCachedData = JSON.stringify({
          data: mockSignals,
          timestamp: Date.now() - 10 * 60000, // 10 minutes ago (expired)
        });
        mockLocalStorage.getItem.mockReturnValue(expiredCachedData);
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

        const result = await signalsApi.getSignals();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/signals');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_signals');
        expect(result).toEqual(mockSignals);
      });

      test('forces refresh when requested', async () => {
        const cachedData = JSON.stringify({
          data: mockSignals,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

        const result = await signalsApi.getSignals(true);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/signals');
        expect(result).toEqual(mockSignals);
      });

      test('caches response data', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

        await signalsApi.getSignals();

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'siren_signals',
          expect.stringContaining(JSON.stringify(mockSignals))
        );
      });

      test('handles cache storage errors gracefully', async () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

        const result = await signalsApi.getSignals();

        expect(result).toEqual(mockSignals);
        expect(console.warn).toHaveBeenCalledWith('Failed to cache data:', expect.any(Error));
      });
    });

    describe('getSignal', () => {
      test('makes GET request to specific signal endpoint', async () => {
        const signalId = '123';
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals[0] });

        const result = await signalsApi.getSignal(signalId);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/signals/${signalId}`);
        expect(result).toEqual(mockSignals[0]);
      });

      test('does not use caching for specific signal lookups', async () => {
        const signalId = '123';
        mockAxiosInstance.get.mockResolvedValue({ data: mockSignals[0] });

        await signalsApi.getSignal(signalId);

        expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('updateManualScore', () => {
      test('makes PUT request to update manual score', async () => {
        const signalId = '123';
        const request: ManualScoreRequest = { score: 8 };
        const updatedSignal = { ...mockSignals[0], manualScore: 8 };
        
        mockAxiosInstance.put.mockResolvedValue({ data: updatedSignal });

        const result = await signalsApi.updateManualScore(signalId, request);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/signals/${signalId}/manual-score`, request);
        expect(result).toEqual(updatedSignal);
      });

      test('clears relevant caches after updating score', async () => {
        const signalId = '123';
        const request: ManualScoreRequest = { score: 8 };
        const updatedSignal = { ...mockSignals[0], manualScore: 8 };
        
        mockAxiosInstance.put.mockResolvedValue({ data: updatedSignal });

        await signalsApi.updateManualScore(signalId, request);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_signals');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_summary');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_category_stats');
      });
    });

    describe('getSignalsByCategory', () => {
      test('makes GET request with category parameter', async () => {
        const category = 'Bug Report';
        const filteredSignals = [mockSignals[0]];
        
        mockAxiosInstance.get.mockResolvedValue({ data: filteredSignals });

        const result = await signalsApi.getSignalsByCategory(category);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/signals/by-category/${category}`);
        expect(result).toEqual(filteredSignals);
      });
    });

    describe('getSummary', () => {
      test('makes GET request to summary endpoint', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockSummary });

        const result = await signalsApi.getSummary();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/signals/summary');
        expect(result).toEqual(mockSummary);
      });

      test('uses cached summary data when available', async () => {
        const cachedData = JSON.stringify({
          data: mockSummary,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await signalsApi.getSummary();

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockSummary);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('siren_summary');
      });
    });
  });

  describe('categoriesApi', () => {
    describe('getCategories', () => {
      test('makes GET request to categories endpoint', async () => {
        const mockCategories = ['Bug Report', 'Feature Request'];
        mockAxiosInstance.get.mockResolvedValue({ data: mockCategories });

        const result = await categoriesApi.getCategories();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/categories');
        expect(result).toEqual(mockCategories);
      });

      test('uses cached categories when available', async () => {
        const mockCategories = ['Bug Report', 'Feature Request'];
        const cachedData = JSON.stringify({
          data: mockCategories,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await categoriesApi.getCategories();

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockCategories);
      });
    });

    describe('getCategoryStats', () => {
      test('makes GET request to category stats endpoint', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockCategoryStats });

        const result = await categoriesApi.getCategoryStats();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/categories/stats');
        expect(result).toEqual(mockCategoryStats);
      });

      test('uses cached category stats when available', async () => {
        const cachedData = JSON.stringify({
          data: mockCategoryStats,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await categoriesApi.getCategoryStats();

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockCategoryStats);
      });
    });

    describe('categorizeSignal', () => {
      test('makes POST request to categorize signal', async () => {
        const signalId = '123';
        const request: CategorizeRequest = { category: 'Bug Report', useAutoCategorization: false };
        const categorizedSignal = { ...mockSignals[0], category: 'Bug Report' };
        
        mockAxiosInstance.post.mockResolvedValue({ data: categorizedSignal });

        const result = await categoriesApi.categorizeSignal(signalId, request);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/categories/categorize/${signalId}`, request);
        expect(result).toEqual(categorizedSignal);
      });

      test('clears relevant caches after categorizing signal', async () => {
        const signalId = '123';
        const request: CategorizeRequest = { category: 'Bug Report', useAutoCategorization: false };
        const categorizedSignal = { ...mockSignals[0], category: 'Bug Report' };
        
        mockAxiosInstance.post.mockResolvedValue({ data: categorizedSignal });

        await categoriesApi.categorizeSignal(signalId, request);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_signals');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_categories');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_category_stats');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_summary');
      });
    });
  });

  describe('healthApi', () => {
    describe('checkHealth', () => {
      test('returns true when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ status: 200 });

        const result = await healthApi.checkHealth();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/signals/summary');
        expect(result).toBe(true);
      });

      test('returns false when API request fails', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

        const result = await healthApi.checkHealth();

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Health check failed:', expect.any(Error));
      });

      test('returns false when API returns non-200 status', async () => {
        mockAxiosInstance.get.mockResolvedValue({ status: 500 });

        const result = await healthApi.checkHealth();

        expect(result).toBe(false);
      });
    });
  });

  describe('teamsApi', () => {
    describe('getTeams', () => {
      test('makes GET request to teams endpoint', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockTeams });

        const result = await teamsApi.getTeams();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/teams');
        expect(result).toEqual(mockTeams);
      });

      test('uses cached teams data when available', async () => {
        const cachedData = JSON.stringify({
          data: mockTeams,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await teamsApi.getTeams();

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockTeams);
      });
    });

    describe('getTeamConfiguration', () => {
      test('makes GET request to specific team endpoint', async () => {
        const teamName = 'team-bolt';
        mockAxiosInstance.get.mockResolvedValue({ data: mockTeamConfig });

        const result = await teamsApi.getTeamConfiguration(teamName);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/teams/${teamName}`);
        expect(result).toEqual(mockTeamConfig);
      });

      test('uses team-specific cache', async () => {
        const teamName = 'team-bolt';
        const cachedData = JSON.stringify({
          data: mockTeamConfig,
          timestamp: Date.now() - 60000,
        });
        mockLocalStorage.getItem.mockReturnValue(cachedData);

        const result = await teamsApi.getTeamConfiguration(teamName);

        expect(mockAxiosInstance.get).not.toHaveBeenCalled();
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`siren_team_config_${teamName}`);
        expect(result).toEqual(mockTeamConfig);
      });
    });

    describe('updateTeamConfiguration', () => {
      test('makes PUT request to update team configuration', async () => {
        const teamName = 'team-bolt';
        const updatedConfig = { ...mockTeamConfig, description: 'Updated description' };
        
        mockAxiosInstance.put.mockResolvedValue({ data: updatedConfig });

        const result = await teamsApi.updateTeamConfiguration(teamName, updatedConfig);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/teams/${teamName}`, updatedConfig);
        expect(result).toEqual(updatedConfig);
      });

      test('clears relevant team caches after update', async () => {
        const teamName = 'team-bolt';
        const updatedConfig = { ...mockTeamConfig, description: 'Updated' };
        
        mockAxiosInstance.put.mockResolvedValue({ data: updatedConfig });

        await teamsApi.updateTeamConfiguration(teamName, updatedConfig);

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_teams');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`siren_team_config_${teamName}`);
      });
    });
  });

  describe('cacheUtils', () => {
    test('clearAllCache removes all SIREN cache entries', () => {
      cacheUtils.clearAllCache();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_signals');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_summary');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_categories');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_category_stats');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_teams');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_team_config');
    });

    test('clearSpecificCache removes specific cache entry', () => {
      const cacheKey = 'siren_signals';
      cacheUtils.clearSpecificCache(cacheKey);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(cacheKey);
    });

    test('getCacheKeys returns cache key constants', () => {
      const keys = cacheUtils.getCacheKeys();

      expect(keys).toHaveProperty('SIGNALS', 'siren_signals');
      expect(keys).toHaveProperty('SUMMARY', 'siren_summary');
      expect(keys).toHaveProperty('CATEGORIES', 'siren_categories');
      expect(keys).toHaveProperty('CATEGORY_STATS', 'siren_category_stats');
      expect(keys).toHaveProperty('TEAMS', 'siren_teams');
      expect(keys).toHaveProperty('TEAM_CONFIG', 'siren_team_config');
    });
  });

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(signalsApi.getSignals()).rejects.toThrow('Network error');
    });

    test('handles invalid cache data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

      const result = await signalsApi.getSignals();

      expect(mockAxiosInstance.get).toHaveBeenCalled();
      expect(result).toEqual(mockSignals);
    });

    test('handles localStorage quota exceeded error', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });
      mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

      const result = await signalsApi.getSignals();

      expect(result).toEqual(mockSignals);
      expect(console.warn).toHaveBeenCalledWith('Failed to cache data:', expect.any(Error));
    });
  });

  describe('Cache Expiration', () => {
    test('cache expires after 5 minutes', async () => {
      const expiredTimestamp = Date.now() - (5 * 60 * 1000 + 1000); // 5 minutes + 1 second ago
      const expiredCachedData = JSON.stringify({
        data: mockSignals,
        timestamp: expiredTimestamp,
      });
      
      mockLocalStorage.getItem.mockReturnValue(expiredCachedData);
      mockAxiosInstance.get.mockResolvedValue({ data: mockSignals });

      await signalsApi.getSignals();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('siren_signals');
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    test('cache is valid within 5 minutes', async () => {
      const validTimestamp = Date.now() - (4 * 60 * 1000); // 4 minutes ago
      const validCachedData = JSON.stringify({
        data: mockSignals,
        timestamp: validTimestamp,
      });
      
      mockLocalStorage.getItem.mockReturnValue(validCachedData);

      const result = await signalsApi.getSignals();

      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(result).toEqual(mockSignals);
    });
  });

  describe('Basic API Functionality', () => {
    test('all API services export the expected functions', () => {
      expect(typeof signalsApi.getSignals).toBe('function');
      expect(typeof signalsApi.getSignal).toBe('function');
      expect(typeof signalsApi.updateManualScore).toBe('function');
      expect(typeof signalsApi.getSignalsByCategory).toBe('function');
      expect(typeof signalsApi.getSummary).toBe('function');

      expect(typeof categoriesApi.getCategories).toBe('function');
      expect(typeof categoriesApi.getCategoryStats).toBe('function');
      expect(typeof categoriesApi.categorizeSignal).toBe('function');

      expect(typeof healthApi.checkHealth).toBe('function');

      expect(typeof teamsApi.getTeams).toBe('function');
      expect(typeof teamsApi.getTeamConfiguration).toBe('function');
      expect(typeof teamsApi.updateTeamConfiguration).toBe('function');

      expect(typeof cacheUtils.clearAllCache).toBe('function');
      expect(typeof cacheUtils.clearSpecificCache).toBe('function');
      expect(typeof cacheUtils.getCacheKeys).toBe('function');
    });
  });
});
