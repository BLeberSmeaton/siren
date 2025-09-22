import React, { useState, useEffect } from 'react';
import { SupportSignal, SignalSummary, CategoryStats, DashboardState } from '../types';
import { signalsApi, categoriesApi, healthApi } from '../services/api';
import DashboardSummary from '../components/DashboardSummary';
import SignalTable from '../components/SignalTable';
import TriagePanel from '../components/TriagePanel';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    signals: [],
    summary: null,
    categoryStats: [],
    loading: true,
    error: null,
    selectedCategory: null,
  });

  const [selectedSignal, setSelectedSignal] = useState<SupportSignal | null>(null);
  const [showTriage, setShowTriage] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check API health first
      const isHealthy = await healthApi.checkHealth();
      if (!isHealthy) {
        throw new Error('API is not responding. Please ensure the SIREN.API server is running.');
      }

      // Load all dashboard data in parallel
      const [signals, summary, categoryStats] = await Promise.all([
        signalsApi.getSignals(),
        signalsApi.getSummary(),
        categoriesApi.getCategoryStats(),
      ]);

      setState(prev => ({
        ...prev,
        signals,
        summary,
        categoryStats,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  const handleSignalSelect = (signal: SupportSignal) => {
    setSelectedSignal(signal);
    setShowTriage(true);
  };

  const handleTriageClose = () => {
    setSelectedSignal(null);
    setShowTriage(false);
  };

  const handleSignalUpdated = (updatedSignal: SupportSignal) => {
    // Update the signal in the list
    setState(prev => ({
      ...prev,
      signals: prev.signals.map(s => s.id === updatedSignal.id ? updatedSignal : s),
    }));
    
    // Refresh summary data
    loadDashboardData();
  };

  const handleCategoryFilter = (category: string | null) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  if (state.error) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <h2>🚨 Connection Error</h2>
          <p>{state.error}</p>
          <div className="error-actions">
            <button 
              className="action-button primary"
              onClick={loadDashboardData}
            >
              🔄 Retry
            </button>
            <div className="api-info">
              <p>Make sure the SIREN.API server is running:</p>
              <code>dotnet run --project SIREN.API</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🚨 SIREN Dashboard</h1>
          <p>Support Signal Intelligence Response Engine</p>
          
          <div className="header-actions">
            <button 
              className="action-button secondary"
              onClick={loadDashboardData}
              disabled={state.loading}
            >
              🔄 Refresh
            </button>
            
            <div className="category-filter">
              <label htmlFor="category-select">Filter by category:</label>
              <select
                id="category-select"
                value={state.selectedCategory || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
              >
                <option value="">All categories</option>
                {state.categoryStats.map(stat => (
                  <option key={stat.category} value={stat.category}>
                    {stat.category} ({stat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Summary Section */}
        <section className="dashboard-section">
          <DashboardSummary
            summary={state.summary}
            categoryStats={state.categoryStats}
            loading={state.loading}
          />
        </section>

        {/* Signals Table Section */}
        <section className="dashboard-section">
          <SignalTable
            signals={state.signals}
            onSignalSelect={handleSignalSelect}
            selectedCategory={state.selectedCategory}
            loading={state.loading}
          />
        </section>
      </div>

      {/* Triage Panel (Modal/Sidebar) */}
      {showTriage && (
        <div className="triage-overlay">
          <TriagePanel
            signal={selectedSignal}
            onClose={handleTriageClose}
            onSignalUpdated={handleSignalUpdated}
          />
        </div>
      )}

      {/* Status indicator */}
      <div className="dashboard-status">
        <span className={`status-indicator ${state.loading ? 'loading' : 'ready'}`}>
          {state.loading ? 'Loading...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
