import React from 'react';
import { SupportSignal } from '../types';

interface SignalTableProps {
  signals: SupportSignal[];
  onSignalSelect: (signal: SupportSignal) => void;
  selectedCategory?: string;
  loading?: boolean;
}

// This is a placeholder component that can be replaced with Feelix Table component
const SignalTable: React.FC<SignalTableProps> = ({ 
  signals, 
  onSignalSelect, 
  selectedCategory, 
  loading = false 
}) => {
  const filteredSignals = selectedCategory 
    ? signals.filter(signal => signal.category === selectedCategory)
    : signals;

  if (loading) {
    return (
      <div className="signal-table-container">
        <div className="loading">Loading signals...</div>
      </div>
    );
  }

  return (
    <div className="signal-table-container">
      <div className="signal-table-header">
        <h3>Support Signals</h3>
        <div className="signal-count">
          Showing {filteredSignals.length} signals
          {selectedCategory && <span className="filter"> filtered by {selectedCategory}</span>}
        </div>
      </div>
      
      {/* TODO: Replace with Feelix Table component */}
      <div className="signal-table">
        <div className="table-header">
          <div className="column">Title</div>
          <div className="column">Category</div>
          <div className="column">Source</div>
          <div className="column">Score</div>
          <div className="column">Updated</div>
          <div className="column">Actions</div>
        </div>
        
        <div className="table-body">
          {filteredSignals.map((signal) => (
            <div key={signal.id} className="table-row">
              <div className="column signal-title">
                <div className="title">{signal.title}</div>
                <div className="description">{signal.description.substring(0, 80)}...</div>
              </div>
              <div className="column">
                <span className={`category-badge ${getCategoryClass(signal.category)}`}>
                  {signal.category || 'Uncategorized'}
                </span>
              </div>
              <div className="column">{signal.source}</div>
              <div className="column">
                {signal.manualScore ? (
                  <span className={`score-badge ${getScoreClass(signal.manualScore)}`}>
                    {signal.manualScore.toFixed(1)}
                  </span>
                ) : (
                  <span className="score-badge unscored">-</span>
                )}
              </div>
              <div className="column">
                {new Date(signal.timestamp).toLocaleDateString()}
              </div>
              <div className="column">
                <button 
                  className="action-button primary"
                  onClick={() => onSignalSelect(signal)}
                >
                  Triage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions for styling
const getCategoryClass = (category?: string): string => {
  if (!category) return 'uncategorized';
  
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('security')) return 'security';
  if (categoryLower.includes('api')) return 'api';
  if (categoryLower.includes('certificate')) return 'certificate';
  if (categoryLower.includes('database')) return 'database';
  return 'other';
};

const getScoreClass = (score: number): string => {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

export default SignalTable;
