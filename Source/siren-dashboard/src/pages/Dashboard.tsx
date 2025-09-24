import React from 'react';
import { SupportSignal } from '../types';
import { isTeamsFeatureEnabled } from '../config/features';
import DashboardSummary from '../components/DashboardSummary';
import SignalTable from '../components/SignalTable';
import TriagePanel from '../components/TriagePanel';
import ReportGenerationModal from '../components/ReportGenerationModal';
import { useDashboardData, useSignalManagement, useTeamManagement, useCategoryFilter } from '../hooks';

const Dashboard: React.FC = () => {
  // Extract business logic into focused custom hooks
  const { 
    signals, 
    summary, 
    categoryStats, 
    teams, 
    loading, 
    error, 
    loadDashboardData, 
    refreshSummaryData, 
    updateSignal 
  } = useDashboardData();
  
  const {
    selectedSignal,
    showTriage,
    showReportModal,
    handleSignalSelect,
    handleTriageClose,
    handleReportModalOpen,
    handleReportModalClose,
  } = useSignalManagement();
  
  const {
    selectedTeam,
    teamError,
    handleTeamSelect,
  } = useTeamManagement();
  
  const {
    selectedCategory,
    handleCategoryFilter,
  } = useCategoryFilter();

  const handleSignalUpdated = async (updatedSignal: SupportSignal) => {
    // Update the signal in the list immediately
    updateSignal(updatedSignal);
    
    // Only refresh summary and category stats (these are affected by signal changes)
    // Don't reload all signals since we just updated the specific one
    await refreshSummaryData();
  };

  // Use team error if present, otherwise use dashboard data error
  const displayError = teamError || error;

  if (displayError) {
    return (
      <div className="dashboard-error">
        <div className="error-content">
          <h2>🚨 Connection Error</h2>
          <p>{displayError}</p>
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
              disabled={loading}
            >
              🔄 Refresh
            </button>
            
            <button 
              className="action-button primary"
              onClick={handleReportModalOpen}
              disabled={loading}
            >
              📊 Generate Report
            </button>
            
            {/* Team Selector - Feature Toggle */}
            {isTeamsFeatureEnabled() && (
              <div className="team-selector">
                <label htmlFor="team-select">Select team:</label>
                <select
                  id="team-select"
                  value={selectedTeam?.teamName || ''}
                  onChange={(e) => handleTeamSelect(e.target.value || null)}
                  disabled={loading}
                >
                  <option value="">No team selected</option>
                  {teams.map((team) => (
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
                value={selectedCategory || ''}
                onChange={(e) => handleCategoryFilter(e.target.value || null)}
              >
                <option value="">All categories</option>
                {categoryStats.map((stat, index) => (
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
      {isTeamsFeatureEnabled() && selectedTeam && (
        <div className="team-context-section">
          <div className="team-context-header">
            <h2>📋 {selectedTeam.displayName} Context</h2>
            <p>{selectedTeam.description}</p>
          </div>
          
          <div className="team-context-details">
            <div className="team-categories">
              <h3>Active Categories ({selectedTeam.categories.filter(c => c.isActive).length})</h3>
              <div className="category-tags">
                {selectedTeam.categories
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
              <h3>Enabled Data Sources ({selectedTeam.dataSources.filter(ds => ds.isEnabled).length})</h3>
              <div className="datasource-list">
                {selectedTeam.dataSources
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
                <p><strong>Default Score:</strong> {selectedTeam.triageSettings.defaultScore}</p>
                <p><strong>Manual Scoring:</strong> {selectedTeam.triageSettings.enableManualScoring ? 'Enabled' : 'Disabled'}</p>
                <p><strong>High Priority Categories:</strong> {selectedTeam.triageSettings.highPriorityCategories.join(', ')}</p>
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
            summary={summary}
            categoryStats={categoryStats}
            loading={loading}
          />
        </section>

        {/* Signals Table Section */}
        <section className="dashboard-section">
          <SignalTable
            signals={signals}
            onSignalSelect={handleSignalSelect}
            selectedCategory={selectedCategory || undefined}
            loading={loading}
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
              signals,
              summary,
              categoryStats,
              teams,
              selectedTeam
            }}
            onClose={handleReportModalClose}
          />
        </div>
      )}

      {/* Status indicator */}
      <div className="dashboard-status">
        <span className={`status-indicator ${loading ? 'loading' : 'ready'}`}>
          {loading ? 'Loading...' : 'Ready'}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
