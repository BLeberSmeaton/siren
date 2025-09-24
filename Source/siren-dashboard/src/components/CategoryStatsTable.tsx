import React from 'react';
import { CategoryStats } from '../types';

interface CategoryStatsTableProps {
  categoryStats: CategoryStats[];
  loading?: boolean;
}

const CategoryStatsTable: React.FC<CategoryStatsTableProps> = ({ categoryStats, loading = false }) => {
  if (loading) {
    return (
      <div className="category-stats-table loading">
        <div className="loading-message">Loading category statistics...</div>
      </div>
    );
  }

  return (
    <div className="category-stats-table">
      <div className="category-stats">
        <h3>Category Statistics</h3>
        <div className="stats-table">
          <div className="table-header">
            <div>Category</div>
            <div>Count</div>
            <div>Manually Scored</div>
            <div>Avg Score</div>
            <div>Latest</div>
          </div>
          {categoryStats.map((stat, index) => (
            <div key={`category-${index}-${stat.category}`} className="table-row">
              <div className="category-name">{stat.category}</div>
              <div>{stat.count}</div>
              <div>{stat.manuallyScored}</div>
              <div>
                {stat.averageManualScore > 0 ? stat.averageManualScore.toFixed(1) : '-'}
              </div>
              <div>{new Date(stat.latestSignal).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryStatsTable;

