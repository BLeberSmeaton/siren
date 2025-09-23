import React, { useState, useEffect } from 'react';
import { SupportSignal, ManualScoreRequest } from '../types';
import { signalsApi, categoriesApi } from '../services/api';

interface TriagePanelProps {
  signal: SupportSignal | null;
  onClose: () => void;
  onSignalUpdated: (signal: SupportSignal) => void;
}

// This is the key Innovation Day feature - Manual Triage Interface
const TriagePanel: React.FC<TriagePanelProps> = ({ signal, onClose, onSignalUpdated }) => {
  const [manualScore, setManualScore] = useState<number>(5);
  const [manualCategory, setManualCategory] = useState<string>('');
  const [triageNotes, setTriageNotes] = useState<string>('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (signal) {
      setManualScore(signal.manualScore || 5);
      setManualCategory(signal.category || '');
      setTriageNotes('');
    }
  }, [signal]);

  useEffect(() => {
    // Load available categories for dropdown
    const loadCategories = async () => {
      try {
        const categories = await categoriesApi.getCategories();
        setAvailableCategories(categories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleSaveScore = async () => {
    if (!signal) return;

    setIsSubmitting(true);
    try {
      // Update manual score
      const scoreRequest: ManualScoreRequest = { score: manualScore };
      let updatedSignal = await signalsApi.updateManualScore(signal.id, scoreRequest);

      // Update category if changed
      if (manualCategory !== signal.category) {
        updatedSignal = await categoriesApi.categorizeSignal(signal.id, {
          category: manualCategory,
          useAutoCategorization: false
        });
      }

      onSignalUpdated(updatedSignal);
      
      // Show success message (in a real app, you'd use a toast/notification)
      alert('Manual triage completed successfully!');
      
      // Close the modal after successful save
      onClose();
    } catch (error) {
      console.error('Failed to save triage:', error);
      alert('Failed to save triage. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoRecategorize = async () => {
    if (!signal) return;

    setIsSubmitting(true);
    try {
      const updatedSignal = await categoriesApi.categorizeSignal(signal.id, {
        useAutoCategorization: true
      });

      setManualCategory(updatedSignal.category || '');
      onSignalUpdated(updatedSignal);
    } catch (error) {
      console.error('Failed to auto-categorize:', error);
      alert('Failed to auto-categorize. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!signal) return null;

  return (
    <div className="triage-panel">
      <div className="panel-header">
        <h2>🎯 Manual Triage</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="panel-content">
        <div className="signal-info">
          <h3>{signal.title}</h3>
          <p className="signal-description">{signal.description}</p>
          <div className="signal-meta">
            <span>Source: {signal.source}</span>
            <span>Updated: {new Date(signal.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="ai-analysis">
          <h4>🤖 AI Analysis</h4>
          <div className="ai-category">
            <strong>Category:</strong> {signal.category || 'Uncategorized'}
            <button 
              className="action-button secondary small"
              onClick={handleAutoRecategorize}
              disabled={isSubmitting}
            >
              Re-analyze
            </button>
          </div>
        </div>

        <div className="human-assessment">
          <h4>👨‍💼 Human Assessment</h4>
          
          {/* TODO: Replace with Feelix form components */}
          <div className="form-group">
            <label htmlFor="severity">Priority Score (1-10):</label>
            <div className="score-slider">
              <input
                type="range"
                id="severity"
                min="1"
                max="10"
                value={manualScore}
                onChange={(e) => setManualScore(Number(e.target.value))}
                className="slider"
              />
              <div className="score-display">
                <span className={`score-badge ${getScoreClass(manualScore)}`}>
                  {manualScore.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="score-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Critical</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Manual Category Override:</label>
            <select
              id="category"
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="category-select"
            >
              <option value="">Select category...</option>
              {(availableCategories || []).map((cat, index) => (
                <option key={`triage-cat-${index}-${cat}`} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Triage Notes:</label>
            <textarea
              id="notes"
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              placeholder="Add context about priority decision, business impact, etc..."
              className="notes-textarea"
              rows={4}
            />
          </div>
        </div>

        <div className="panel-actions">
          <button 
            className="action-button primary"
            onClick={handleSaveScore}
            disabled={isSubmitting}
          >
            {isSubmitting ? '💾 Saving...' : '💾 Save Triage'}
          </button>
          <button 
            className="action-button secondary"
            onClick={onClose}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const getScoreClass = (score: number): string => {
  if (score >= 8) return 'high';
  if (score >= 6) return 'medium-high';
  if (score >= 4) return 'medium';
  return 'low';
};

export default TriagePanel;
