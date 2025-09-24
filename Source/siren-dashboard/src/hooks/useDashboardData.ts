import { useState, useEffect, useCallback } from 'react';
import { signalsApi, categoriesApi, healthApi, teamsApi } from '../services/api';
import { isTeamsFeatureEnabled } from '../config/features';
import { DashboardState, SupportSignal, SignalSummary, CategoryStats, TeamSummary } from '../types';

interface DashboardData {
  signals: SupportSignal[];
  summary: SignalSummary | null;
  categoryStats: CategoryStats[];
  teams: TeamSummary[];
  loading: boolean;
  error: string | null;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    signals: [],
    summary: null,
    categoryStats: [],
    teams: [],
    loading: true,
    error: null,
  });

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check API health first
      const isHealthy = await healthApi.checkHealth();
      if (!isHealthy) {
        throw new Error('API is not responding. Please ensure the SIREN.API server is running.');
      }

      // Load core dashboard data in parallel
      const [signals, summary, categoryStats] = await Promise.all([
        signalsApi.getSignals(forceRefresh),
        signalsApi.getSummary(forceRefresh),
        categoriesApi.getCategoryStats(forceRefresh),
      ]);

      // Conditionally load teams data only if the feature is enabled
      const teams = isTeamsFeatureEnabled() 
        ? await teamsApi.getTeams(forceRefresh)
        : [];

      setData({
        signals,
        summary,
        categoryStats,
        teams,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  }, []);

  const refreshSummaryData = useCallback(async () => {
    try {
      const [summary, categoryStats] = await Promise.all([
        signalsApi.getSummary(true), // Force refresh
        categoriesApi.getCategoryStats(true), // Force refresh
      ]);

      setData(prev => ({
        ...prev,
        summary,
        categoryStats,
      }));
    } catch (error) {
      console.error('Failed to refresh summary data:', error);
      // Fallback to full reload if partial refresh fails
      loadDashboardData();
    }
  }, [loadDashboardData]);

  const updateSignal = useCallback((updatedSignal: SupportSignal) => {
    setData(prev => ({
      ...prev,
      signals: prev.signals.map(s => s.id === updatedSignal.id ? updatedSignal : s),
    }));
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    loadDashboardData,
    refreshSummaryData,
    updateSignal,
  };
};
