import axios from 'axios';
import { SupportSignal, SignalSummary, CategoryStats, ManualScoreRequest, CategorizeRequest } from '../types';

// Configure axios with the API base URL
const api = axios.create({
  baseURL: 'http://localhost:5135/api', // Update port if different
  timeout: 10000,
});

// Add request/response interceptors for logging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// Signals API endpoints
export const signalsApi = {
  // Get all signals with automatic categorization
  getSignals: async (): Promise<SupportSignal[]> => {
    const response = await api.get<SupportSignal[]>('/signals');
    return response.data;
  },

  // Get specific signal by ID
  getSignal: async (id: string): Promise<SupportSignal> => {
    const response = await api.get<SupportSignal>(`/signals/${id}`);
    return response.data;
  },

  // Update manual score for a signal (key triage feature)
  updateManualScore: async (id: string, request: ManualScoreRequest): Promise<SupportSignal> => {
    const response = await api.put<SupportSignal>(`/signals/${id}/manual-score`, request);
    return response.data;
  },

  // Get signals filtered by category
  getSignalsByCategory: async (category: string): Promise<SupportSignal[]> => {
    const response = await api.get<SupportSignal[]>(`/signals/by-category/${category}`);
    return response.data;
  },

  // Get dashboard summary statistics
  getSummary: async (): Promise<SignalSummary> => {
    const response = await api.get<SignalSummary>('/signals/summary');
    return response.data;
  },
};

// Categories API endpoints
export const categoriesApi = {
  // Get all unique categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/categories');
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (): Promise<CategoryStats[]> => {
    const response = await api.get<CategoryStats[]>('/categories/stats');
    return response.data;
  },

  // Manually categorize a signal
  categorizeSignal: async (signalId: string, request: CategorizeRequest): Promise<SupportSignal> => {
    const response = await api.post<SupportSignal>(`/categories/categorize/${signalId}`, request);
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

export default api;
