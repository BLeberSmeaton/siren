import React, { useState, useEffect } from 'react';
import { SupportSignal, DashboardState } from '../types';
import { signalsApi, categoriesApi, healthApi, teamsApi } from '../services/api';
import { isTeamsFeatureEnabled } from '../config/features';
import DashboardSummary from '../components/DashboardSummary';
import SignalTable from '../components/SignalTable';
import TriagePanel from '../components/TriagePanel';
import ReportGenerationModal from '../components/ReportGenerationModal';

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    signals: [],
    summary: null,
    categoryStats: [],
    teams: [],
    selectedTeam: null,
    loading: true,
    error: null,
    selectedCategory: null,
  });

  const [selectedSignal, setSelectedSignal] = useState<SupportSignal | null>(null);
  const [showTriage, setShowTriage] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (forceRefresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

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

      setState(prev => ({
        ...prev,
        signals,
        summary,
        categoryStats,
        teams,
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

  const handleSignalUpdated = async (updatedSignal: SupportSignal) => {
    // Update the signal in the list immediately
    setState(prev => ({
      ...prev,
      signals: prev.signals.map(s => s.id === updatedSignal.id ? updatedSignal : s),
    }));
    
    // Only refresh summary and category stats (these are affected by signal changes)
    // Don't reload all signals since we just updated the specific one
    try {
      const [summary, categoryStats] = await Promise.all([
        signalsApi.getSummary(true), // Force refresh
        categoriesApi.getCategoryStats(true), // Force refresh
      ]);

      setState(prev => ({
        ...prev,
        summary,
        categoryStats,
      }));
    } catch (error) {
      console.error('Failed to refresh summary data:', error);
      // Fallback to full reload only if partial refresh fails
      loadDashboardData();
    }
  };

  const handleCategoryFilter = (category: string | null) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  // Team selection handler - used when teams feature is enabled
  const handleTeamSelect = async (teamName: string | null) => {
    if (!teamName) {
      setState(prev => ({ ...prev, selectedTeam: null }));
      return;
    }

    try {
      const teamConfig = await teamsApi.getTeamConfiguration(teamName);
      setState(prev => ({ ...prev, selectedTeam: teamConfig }));
    } catch (error) {
      console.error('Failed to load team configuration:', error);
      setState(prev => ({ 
        ...prev, 
        selectedTeam: null,
        error: `Failed to load team configuration for ${teamName}` 
      }));
    }
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
              onClick={() => loadDashboardData(true)}
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
              onClick={() => loadDashboardData(true)}
              disabled={state.loading}
            >
              🔄 Refresh
            </button>
            
            <button 
              className="action-button primary"
              onClick={() => setShowReportModal(true)}
              disabled={state.loading}
            >
              📊 Generate Report
            </button>
            
            {/* Team Selector - Feature Toggle */}
            {isTeamsFeatureEnabled() && (
              <div className="team-selector">
                <label htmlFor="team-select">Select team:</label>
                <select
                  id="team-select"
                  value={state.selectedTeam?.teamName || ''}
                  onChange={(e) => handleTeamSelect(e.target.value || null)}
                  disabled={state.loading}
                >
                  <option value="">No team selected</option>
                  {state.teams.map((team) => (
                    <option key={team.teamName} value={team.teamName}>
                      {team.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="category-filter">
              <label htmlFor="category-select">Filter by category:</label>
              <select
                id="category-select"
                value={state.selectedCategory || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
              >
                <option value="">All categories</option>
                {state.categoryStats.map((stat, index) => (
                  <option key={`filter-${index}-${stat.category}`} value={stat.category}>
                    {stat.category} ({stat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Team Context Section - Feature Toggle */}
      {isTeamsFeatureEnabled() && state.selectedTeam && (
        <div className="team-context-section">
          <div className="team-context-header">
            <h2>📋 {state.selectedTeam.displayName} Context</h2>
            <p>{state.selectedTeam.description}</p>
          </div>
          
          <div className="team-context-details">
            <div className="team-categories">
              <h3>Active Categories ({state.selectedTeam.categories.filter(c => c.isActive).length})</h3>
              <div className="category-tags">
                {state.selectedTeam.categories
                  .filter(c => c.isActive)
                  .map((category) => (
                    <span 
                      key={category.name} 
                      className="category-tag"
                      style={{ 
                        backgroundColor: category.color || '#007bff',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8em',
                        margin: '2px'
                      }}
                      title={category.description || category.displayName}
                    >
                      {category.displayName} (P{category.priority})
                    </span>
                  ))}
              </div>
            </div>
            
            <div className="team-datasources">
              <h3>Enabled Data Sources ({state.selectedTeam.dataSources.filter(ds => ds.isEnabled).length})</h3>
              <div className="datasource-list">
                {state.selectedTeam.dataSources
                  .filter(ds => ds.isEnabled)
                  .map((source) => (
                    <div key={source.name} className="datasource-item">
                      <span className="datasource-type">{source.sourceType}</span>
                      <span className="datasource-name">{source.name}</span>
                      <span className="datasource-categories">
                        ({source.applicableCategories.length} categories)
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="team-triage-settings">
              <h3>Triage Settings</h3>
              <div className="triage-details">
                <p><strong>Default Score:</strong> {state.selectedTeam.triageSettings.defaultScore}</p>
                <p><strong>Manual Scoring:</strong> {state.selectedTeam.triageSettings.enableManualScoring ? 'Enabled' : 'Disabled'}</p>
                <p><strong>High Priority Categories:</strong> {state.selectedTeam.triageSettings.highPriorityCategories.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            selectedCategory={state.selectedCategory || undefined}
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

      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="report-overlay">
          <ReportGenerationModal
            dashboardData={{
              signals: state.signals,
              summary: state.summary,
              categoryStats: state.categoryStats,
              teams: state.teams,
              selectedTeam: state.selectedTeam
            }}
            onClose={() => setShowReportModal(false)}
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
