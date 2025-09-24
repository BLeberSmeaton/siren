import React, { useState } from 'react';

// Define the interfaces based on user requirements
interface ToilItemDisplay {
  // Core identifiers
  rank: number; // 1, 2, 3
  title: string; // "Authentication Token Renewal Issues"
  category: string; // "Authentication" 
  status: 'NotStarted' | 'InProgress' | 'Complete';
  
  // Key metrics (at-a-glance)
  discoveredTime: string; // "2 hours ago" | "Yesterday" | "3 days ago"
  recurrenceCount: number; // 8 related tickets
  priorityScore: number; // 8.5/10
  estimatedEffortHours: number; // 4-6 hours
}

interface ToilItemDetails {
  // Impact analysis
  affectedSignalIds: string[]; // List of related support signals
  timeSpentToDate: number; // 12 hours already spent on similar issues
  potentialTimeSavings: number; // 3-4 hours/week if resolved
  businessImpactLevel: 'Low' | 'Medium' | 'High';
  
  // Pattern insights
  summaryReason: string; // "Users repeatedly fail token refresh after 24hrs..."
  commonKeywords: string[]; // ["token", "expired", "refresh", "401"]
  trendDirection: 'Increasing' | 'Stable' | 'Decreasing';
  
  // Context
  lastOccurrenceDate: Date;
  avgManualScore: number; // From triage panel scores
  teamSpecificNotes?: string;
}

interface ToilItem extends ToilItemDisplay {
  id: string;
  details: ToilItemDetails;
}

interface ToilReductionPanelProps {
  loading?: boolean;
}

// Mock data for demonstration - in real implementation this would come from API
const mockToilItems: ToilItem[] = [
  {
    id: '1',
    rank: 1,
    title: 'Authentication Token Renewal Issues',
    category: 'Authentication',
    status: 'NotStarted',
    discoveredTime: '2 hours ago',
    recurrenceCount: 8,
    priorityScore: 8.5,
    estimatedEffortHours: 5,
    details: {
      affectedSignalIds: ['sig1', 'sig2', 'sig3'],
      timeSpentToDate: 12,
      potentialTimeSavings: 4,
      businessImpactLevel: 'High',
      summaryReason: 'Users repeatedly fail token refresh after 24hrs, causing multiple support tickets',
      commonKeywords: ['token', 'expired', 'refresh', '401'],
      trendDirection: 'Increasing',
      lastOccurrenceDate: new Date(),
      avgManualScore: 7.2,
      teamSpecificNotes: 'Affects primarily mobile users'
    }
  },
  {
    id: '2',
    rank: 2,
    title: 'Email Delivery Delays',
    category: 'Email',
    status: 'InProgress',
    discoveredTime: 'Yesterday',
    recurrenceCount: 5,
    priorityScore: 6.8,
    estimatedEffortHours: 3,
    details: {
      affectedSignalIds: ['sig4', 'sig5'],
      timeSpentToDate: 8,
      potentialTimeSavings: 2,
      businessImpactLevel: 'Medium',
      summaryReason: 'Email notifications delayed by 15-30 minutes during peak hours',
      commonKeywords: ['email', 'delay', 'notification', 'queue'],
      trendDirection: 'Stable',
      lastOccurrenceDate: new Date(),
      avgManualScore: 5.5
    }
  },
  {
    id: '3',
    rank: 3,
    title: 'PDF Generation Timeouts',
    category: 'Reports',
    status: 'Complete',
    discoveredTime: '3 days ago',
    recurrenceCount: 3,
    priorityScore: 4.2,
    estimatedEffortHours: 2,
    details: {
      affectedSignalIds: ['sig6'],
      timeSpentToDate: 6,
      potentialTimeSavings: 1,
      businessImpactLevel: 'Low',
      summaryReason: 'Large PDF reports timeout after 30 seconds, requiring manual regeneration',
      commonKeywords: ['pdf', 'timeout', 'report', 'generation'],
      trendDirection: 'Decreasing',
      lastOccurrenceDate: new Date(),
      avgManualScore: 4.0
    }
  }
];

const ToilReductionPanel: React.FC<ToilReductionPanelProps> = ({ loading = false }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [toilItems, setToilItems] = useState<ToilItem[]>(mockToilItems);

  const updateToilStatus = (itemId: string, newStatus: ToilItem['status']) => {
    setToilItems(items => 
      items.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getStatusIcon = (status: ToilItem['status']) => {
    switch (status) {
      case 'NotStarted': return '⏳';
      case 'InProgress': return '🏗️';
      case 'Complete': return '✅';
    }
  };

  const getStatusClass = (status: ToilItem['status']) => {
    switch (status) {
      case 'NotStarted': return 'not-started';
      case 'InProgress': return 'in-progress';
      case 'Complete': return 'complete';
    }
  };

  const getPriorityClass = (score: number) => {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const getTrendIcon = (direction: ToilItemDetails['trendDirection']) => {
    switch (direction) {
      case 'Increasing': return '↗️';
      case 'Stable': return '➡️';
      case 'Decreasing': return '↘️';
    }
  };

  if (loading) {
    return (
      <div className="toil-reduction-panel loading">
        <div className="loading-message">Loading toil reduction insights...</div>
      </div>
    );
  }

  return (
    <div className="toil-reduction-panel">
      <div className="panel-header">
        <h3>🎯 Toil Reduction Priorities</h3>
        <p className="panel-subtitle">Focus areas to reduce recurring support burden</p>
      </div>

      <div className="toil-items">
        {toilItems.map((item) => (
          <div key={item.id} className={`toil-item ${getStatusClass(item.status)}`}>
            <div className="toil-item-header" onClick={() => toggleExpand(item.id)}>
              <div className="item-rank">#{item.rank}</div>
              <div className="item-main">
                <div className="item-title-row">
                  <h4 className="item-title">{item.title}</h4>
                  <span className={`priority-badge ${getPriorityClass(item.priorityScore)}`}>
                    {item.priorityScore.toFixed(1)}
                  </span>
                </div>
                <div className="item-meta">
                  <span className="category">{item.category}</span>
                  <span className="discovered">{item.discoveredTime}</span>
                  <span className="recurrence">{item.recurrenceCount} tickets</span>
                  <span className="effort">{item.estimatedEffortHours}h est.</span>
                </div>
              </div>
              <div className="item-status">
                <div className={`status-indicator ${getStatusClass(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="expand-icon">
                  {expandedItem === item.id ? '▼' : '▶'}
                </div>
              </div>
            </div>

            {expandedItem === item.id && (
              <div className="toil-item-details">
                <div className="details-grid">
                  <div className="impact-metrics">
                    <h5>📊 Impact Analysis</h5>
                    <div className="metrics">
                      <div className="metric">
                        <span className="label">Time spent:</span>
                        <span className="value">{item.details.timeSpentToDate}h this month</span>
                      </div>
                      <div className="metric">
                        <span className="label">Potential savings:</span>
                        <span className="value">{item.details.potentialTimeSavings}h/week</span>
                      </div>
                      <div className="metric">
                        <span className="label">Business impact:</span>
                        <span className={`value impact-${item.details.businessImpactLevel.toLowerCase()}`}>
                          {item.details.businessImpactLevel}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="label">Trend:</span>
                        <span className="value">
                          {getTrendIcon(item.details.trendDirection)} {item.details.trendDirection}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pattern-insights">
                    <h5>🔍 Pattern Analysis</h5>
                    <p className="summary-reason">{item.details.summaryReason}</p>
                    <div className="keywords">
                      <strong>Common keywords:</strong>
                      <div className="keyword-tags">
                        {item.details.commonKeywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag">{keyword}</span>
                        ))}
                      </div>
                    </div>
                    <div className="context-info">
                      <div>Last occurrence: {item.details.lastOccurrenceDate.toLocaleDateString()}</div>
                      <div>Avg manual score: {item.details.avgManualScore.toFixed(1)}</div>
                      {item.details.teamSpecificNotes && (
                        <div>Team notes: {item.details.teamSpecificNotes}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="item-actions">
                  {item.status === 'NotStarted' && (
                    <button 
                      className="action-button primary"
                      onClick={() => updateToilStatus(item.id, 'InProgress')}
                    >
                      🏗️ Start Working
                    </button>
                  )}
                  {item.status === 'InProgress' && (
                    <button 
                      className="action-button success"
                      onClick={() => updateToilStatus(item.id, 'Complete')}
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                  {item.status === 'Complete' && (
                    <button 
                      className="action-button secondary"
                      onClick={() => updateToilStatus(item.id, 'NotStarted')}
                    >
                      🔄 Reopen
                    </button>
                  )}
                  <button className="action-button secondary">
                    📋 View Related Signals ({item.details.affectedSignalIds.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel-footer">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Items in progress:</span>
            <span className="stat-value">{toilItems.filter(item => item.status === 'InProgress').length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Potential weekly savings:</span>
            <span className="stat-value">
              {toilItems.reduce((total, item) => total + item.details.potentialTimeSavings, 0)}h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToilReductionPanel;

