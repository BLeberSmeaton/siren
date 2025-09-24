import React, { useState, useEffect } from 'react';
import { SupportSignal, CategoryStats } from '../types';
import Pagination from './Pagination';

interface SignalTableProps {
  signals: SupportSignal[];
  onSignalSelect: (signal: SupportSignal) => void;
  selectedCategory?: string;
  categoryStats: CategoryStats[];
  onCategoryFilter: (category: string | null) => void;
  loading?: boolean;
}

// This is a placeholder component that can be replaced with Feelix Table component
const SignalTable: React.FC<SignalTableProps> = ({ 
  signals, 
  onSignalSelect, 
  selectedCategory, 
  categoryStats,
  onCategoryFilter,
  loading = false 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const filteredSignals = selectedCategory 
    ? signals.filter(signal => signal.category === selectedCategory)
    : signals;

  // Reset to first page when signals or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [signals, selectedCategory]);

  // Calculate pagination
  const totalItems = filteredSignals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSignals = filteredSignals.slice(startIndex, endIndex);
  
  // Calculate display info
  const showingStart = totalItems === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, totalItems);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        <div className="table-title-section">
          <h3>Support Signals</h3>
          <div className="signal-count">
            {totalItems === 0 ? (
              'No signals found'
            ) : (
              <>
                {showingStart === showingEnd ? (
                  `Showing ${showingStart} of ${totalItems} signals`
                ) : (
                  `Showing ${showingStart}-${showingEnd} of ${totalItems} signals`
                )}
                {selectedCategory && <span className="filter"> filtered by {selectedCategory}</span>}
              </>
            )}
          </div>
        </div>
        
        <div className="table-controls">
          <div className="category-filter">
            <label htmlFor="signal-category-select">Filter by category:</label>
            <select
              id="signal-category-select"
              value={selectedCategory || ''}
              onChange={(e) => onCategoryFilter(e.target.value || null)}
            >
              <option value="">All categories</option>
              {categoryStats.map((stat, index) => (
                <option key={`signal-filter-${index}-${stat.category}`} value={stat.category}>
                  {stat.category} ({stat.count})
                </option>
              ))}
            </select>
          </div>
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
          {currentSignals.map((signal) => (
            <div key={signal.id} className="table-row">
              <div className="column signal-title">
                <div className="title">{signal.title}</div>
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
      
      {/* Pagination Component */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          showingStart={showingStart}
          showingEnd={showingEnd}
        />
      )}
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
