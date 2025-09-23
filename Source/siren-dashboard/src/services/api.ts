import axios from 'axios';
import { SupportSignal, SignalSummary, CategoryStats, ManualScoreRequest, CategorizeRequest, TeamSummary, TeamConfiguration } from '../types';

// Configure axios with the API base URL
const api = axios.create({
  baseURL: 'http://localhost:5227/api', // Updated to match backend port
  timeout: 10000,
});

// Browser caching utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEYS = {
  SIGNALS: 'siren_signals',
  SUMMARY: 'siren_summary', 
  CATEGORIES: 'siren_categories',
  CATEGORY_STATS: 'siren_category_stats',
  TEAMS: 'siren_teams',
  TEAM_CONFIG: 'siren_team_config'
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // Handle storage quota exceeded or other errors gracefully
    console.warn('Failed to cache data:', error);
  }
};

const clearCache = (key?: string): void => {
  if (key) {
    localStorage.removeItem(key);
  } else {
    // Clear all SIREN cache entries
    Object.values(CACHE_KEYS).forEach(cacheKey => {
      localStorage.removeItem(cacheKey);
    });
  }
};

// Add request/response interceptors for logging and error handling
api.interceptors.request.use(
  (config) => {
    // Only log non-cached requests to reduce console noise
    if (!config.url?.includes('summary') || config.headers?.['x-force-refresh']) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Only log significant responses to reduce console noise
    if (!response.config.url?.includes('summary') || response.config.headers?.['x-force-refresh']) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// Signals API endpoints
export const signalsApi = {
  // Get all signals with automatic categorization (cached)
  getSignals: async (forceRefresh = false): Promise<SupportSignal[]> => {
    if (!forceRefresh) {
      const cached = getCachedData<SupportSignal[]>(CACHE_KEYS.SIGNALS);
      if (cached) {
        console.log('Using cached signals data');
        return cached;
      }
    }
    
    const response = await api.get<SupportSignal[]>('/signals');
    setCachedData(CACHE_KEYS.SIGNALS, response.data);
    return response.data;
  },

  // Get specific signal by ID (not cached - specific lookups)
  getSignal: async (id: string): Promise<SupportSignal> => {
    const response = await api.get<SupportSignal>(`/signals/${id}`);
    return response.data;
  },

  // Update manual score for a signal (clears cache)
  updateManualScore: async (id: string, request: ManualScoreRequest): Promise<SupportSignal> => {
    const response = await api.put<SupportSignal>(`/signals/${id}/manual-score`, request);
    // Clear relevant caches since data has changed
    clearCache(CACHE_KEYS.SIGNALS);
    clearCache(CACHE_KEYS.SUMMARY);
    clearCache(CACHE_KEYS.CATEGORY_STATS);
    return response.data;
  },

  // Get signals filtered by category (not cached - specific filter)
  getSignalsByCategory: async (category: string): Promise<SupportSignal[]> => {
    const response = await api.get<SupportSignal[]>(`/signals/by-category/${category}`);
    return response.data;
  },

  // Get dashboard summary statistics (cached)
  getSummary: async (forceRefresh = false): Promise<SignalSummary> => {
    if (!forceRefresh) {
      const cached = getCachedData<SignalSummary>(CACHE_KEYS.SUMMARY);
      if (cached) {
        console.log('Using cached summary data');
        return cached;
      }
    }
    
    const response = await api.get<SignalSummary>('/signals/summary');
    setCachedData(CACHE_KEYS.SUMMARY, response.data);
    return response.data;
  },
};

// Categories API endpoints
export const categoriesApi = {
  // Get all unique categories (cached)
  getCategories: async (forceRefresh = false): Promise<string[]> => {
    if (!forceRefresh) {
      const cached = getCachedData<string[]>(CACHE_KEYS.CATEGORIES);
      if (cached) {
        console.log('Using cached categories data');
        return cached;
      }
    }
    
    const response = await api.get<string[]>('/categories');
    setCachedData(CACHE_KEYS.CATEGORIES, response.data);
    return response.data;
  },

  // Get category statistics (cached)
  getCategoryStats: async (forceRefresh = false): Promise<CategoryStats[]> => {
    if (!forceRefresh) {
      const cached = getCachedData<CategoryStats[]>(CACHE_KEYS.CATEGORY_STATS);
      if (cached) {
        console.log('Using cached category stats data');
        return cached;
      }
    }
    
    const response = await api.get<CategoryStats[]>('/categories/stats');
    setCachedData(CACHE_KEYS.CATEGORY_STATS, response.data);
    return response.data;
  },

  // Manually categorize a signal (clears cache)
  categorizeSignal: async (signalId: string, request: CategorizeRequest): Promise<SupportSignal> => {
    const response = await api.post<SupportSignal>(`/categories/categorize/${signalId}`, request);
    // Clear relevant caches since data has changed
    clearCache(CACHE_KEYS.SIGNALS);
    clearCache(CACHE_KEYS.CATEGORIES);
    clearCache(CACHE_KEYS.CATEGORY_STATS);
    clearCache(CACHE_KEYS.SUMMARY);
    return response.data;
  },
};

// Health check endpoint
export const healthApi = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get('/signals/summary');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};

// Teams API endpoints
export const teamsApi = {
  // Get all available teams (cached)
  getTeams: async (forceRefresh = false): Promise<TeamSummary[]> => {
    if (!forceRefresh) {
      const cached = getCachedData<TeamSummary[]>(CACHE_KEYS.TEAMS);
      if (cached) {
        console.log('Using cached teams data');
        return cached;
      }
    }
    
    const response = await api.get<TeamSummary[]>('/teams');
    setCachedData(CACHE_KEYS.TEAMS, response.data);
    return response.data;
  },

  // Get detailed team configuration (cached per team)
  getTeamConfiguration: async (teamName: string, forceRefresh = false): Promise<TeamConfiguration> => {
    const cacheKey = `${CACHE_KEYS.TEAM_CONFIG}_${teamName}`;
    
    if (!forceRefresh) {
      const cached = getCachedData<TeamConfiguration>(cacheKey);
      if (cached) {
        console.log(`Using cached team configuration for ${teamName}`);
        return cached;
      }
    }
    
    const response = await api.get<TeamConfiguration>(`/teams/${teamName}`);
    setCachedData(cacheKey, response.data);
    return response.data;
  },

  // Update team configuration (clears team cache)
  updateTeamConfiguration: async (teamName: string, configuration: TeamConfiguration): Promise<TeamConfiguration> => {
    const response = await api.put<TeamConfiguration>(`/teams/${teamName}`, configuration);
    
    // Clear relevant team caches
    clearCache(CACHE_KEYS.TEAMS);
    clearCache(`${CACHE_KEYS.TEAM_CONFIG}_${teamName}`);
    
    return response.data;
  },
};

// Cache management utilities
export const cacheUtils = {
  clearAllCache: () => clearCache(),
  clearSpecificCache: (key: string) => clearCache(key),
  getCacheKeys: () => CACHE_KEYS,
};

export default api;
