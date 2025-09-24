import React, { useState, useEffect } from 'react';
import { 
  TeamConfiguration, 
  CategoryConfiguration, 
  DataSourceConfiguration,
  SupportSignal 
} from '../types';
import './NewTeamWizard.css';

interface NewTeamWizardProps {
  onClose: () => void;
  onTeamCreated: (team: TeamConfiguration) => void;
  existingTeams: string[];
}

interface PatternSuggestion {
  categoryName: string;
  description: string;
  keywords: string[];
  confidence: number;
  sampleSignals: string[];
  reasoningExplanation: string;
}

interface SimilarTeam {
  teamName: string;
  similarityScore: number;
  commonPatterns: string[];
}

const NewTeamWizard: React.FC<NewTeamWizardProps> = ({ 
  onClose, 
  onTeamCreated, 
  existingTeams 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Step 1: Basic Team Info
  const [teamName, setTeamName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2: Sample Data Analysis
  const [sampleData, setSampleData] = useState<File | null>(null);
  const [sampleSignals, setSampleSignals] = useState<SupportSignal[]>([]);
  const [patternSuggestions, setPatternSuggestions] = useState<PatternSuggestion[]>([]);
  const [similarTeams, setSimilarTeams] = useState<SimilarTeam[]>([]);
  
  // Step 3: Category Configuration
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [customCategories, setCustomCategories] = useState<CategoryConfiguration[]>([]);
  
  // Step 4: Data Source Configuration
  const [dataSources, setDataSources] = useState<DataSourceConfiguration[]>([]);
  
  // Step 5: Triage Settings
  const [enableManualScoring, setEnableManualScoring] = useState(true);
  const [defaultScore, setDefaultScore] = useState(5);
  const [highPriorityCategories, setHighPriorityCategories] = useState<string[]>([]);

  const totalSteps = 5;

  const handleSampleDataUpload = async (file: File) => {
    setSampleData(file);
    setIsAnalyzing(true);

    try {
      // Parse CSV file to extract sample signals
      const text = await file.text();
      const signals = parseCsvToSignals(text);
      setSampleSignals(signals);

      // Call pattern analysis API
      const response = await fetch('/api/pattern-learning/analyze-new-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedTeamName: teamName,
          sampleSignals: signals,
          existingTeamNames: existingTeams
        })
      });

      if (response.ok) {
        const analysisResult = await response.json();
        setPatternSuggestions(analysisResult.suggestedCategories || []);
        setSimilarTeams(analysisResult.similarTeams || []);
      }
    } catch (error) {
      console.error('Failed to analyze sample data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseCsvToSignals = (csvText: string): SupportSignal[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('summary'));
    const descIndex = headers.findIndex(h => h.includes('description') || h.includes('detail'));
    const sourceIndex = headers.findIndex(h => h.includes('source') || h.includes('origin'));
    const timestampIndex = headers.findIndex(h => h.includes('date') || h.includes('time'));
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map((line, index) => {
        const columns = line.split(',');
        return {
          id: `temp-${index}`,
          title: columns[titleIndex] || 'Unknown',
          description: columns[descIndex] || '',
          source: columns[sourceIndex] || 'CSV Upload',
          timestamp: columns[timestampIndex] || new Date().toISOString(),
        };
      })
      .slice(0, 100); // Limit to 100 signals for analysis
  };

  const addCustomCategory = () => {
    const newCategory: CategoryConfiguration = {
      name: '',
      displayName: '',
      description: '',
      keywords: [],
      priority: customCategories.length + 1,
      color: '#007bff',
      isActive: true
    };
    setCustomCategories([...customCategories, newCategory]);
  };

  const updateCustomCategory = (index: number, field: keyof CategoryConfiguration, value: any) => {
    const updated = [...customCategories];
    (updated[index] as any)[field] = value;
    setCustomCategories(updated);
  };

  const removeCustomCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index));
  };

  const handleKeywordInput = (categoryIndex: number, keywords: string) => {
    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
    updateCustomCategory(categoryIndex, 'keywords', keywordList);
  };

  const generateFinalCategories = (): CategoryConfiguration[] => {
    const finalCategories: CategoryConfiguration[] = [];
    
    // Add selected pattern suggestions
    patternSuggestions.forEach((suggestion, index) => {
      if (selectedSuggestions.has(suggestion.categoryName)) {
        finalCategories.push({
          name: suggestion.categoryName,
          displayName: suggestion.categoryName,
          description: suggestion.description,
          keywords: suggestion.keywords,
          priority: index + 1,
          color: generateCategoryColor(suggestion.categoryName),
          isActive: true
        });
      }
    });
    
    // Add custom categories
    customCategories.forEach(category => {
      if (category.name && category.keywords.length > 0) {
        finalCategories.push({
          ...category,
          priority: finalCategories.length + 1
        });
      }
    });
    
    return finalCategories;
  };

  const generateCategoryColor = (categoryName: string): string => {
    const colors = [
      '#FF6B35', '#D32F2F', '#1976D2', '#F44336', '#9C27B0',
      '#FF9800', '#4CAF50', '#607D8B', '#795548', '#E91E63'
    ];
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const handleCreateTeam = () => {
    const finalCategories = generateFinalCategories();
    
    const newTeam: TeamConfiguration = {
      teamName,
      displayName,
      description,
      dataSources,
      categories: finalCategories,
      triageSettings: {
        enableManualScoring,
        defaultScore,
        highPriorityCategories,
        categoryDefaultScores: {}
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onTeamCreated(newTeam);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return teamName && displayName;
      case 2: return sampleSignals.length > 0;
      case 3: return selectedSuggestions.size > 0 || customCategories.some(c => c.name && c.keywords.length > 0);
      case 4: return true; // Data sources are optional
      case 5: return true; // Triage settings have defaults
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="wizard-steps">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div key={step} className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
          <div className="step-number">{step}</div>
          <div className="step-title" data-testid="step-title">
            {step === 1 && 'Team Info'}
            {step === 2 && 'Sample Data'}
            {step === 3 && 'Categories'}
            {step === 4 && 'Data Sources'}
            {step === 5 && 'Settings'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="wizard-step">
      <h3>🏷️ Team Information</h3>
      <p>Let's start with basic information about your new team.</p>
      
      <div className="form-group">
        <label htmlFor="team-name">Team Name (used internally)</label>
        <input
          type="text"
          id="team-name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g., team-payments"
          className="form-input"
        />
        <small>Use lowercase with hyphens. This will be used in configuration files.</small>
      </div>

      <div className="form-group">
        <label htmlFor="display-name">Display Name</label>
        <input
          type="text"
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g., Payments Team"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this team handles..."
          className="form-textarea"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="wizard-step">
      <h3>📊 Sample Data Analysis</h3>
      <p>Upload a sample of your team's support signals to get intelligent category suggestions.</p>
      
      <div className="upload-section">
        <div className="file-upload">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files && handleSampleDataUpload(e.target.files[0])}
            id="sample-upload"
            className="file-input"
            data-testid="file-upload-input"
          />
          <label htmlFor="sample-upload" className="upload-label">
            📎 Upload CSV File
            <small>Support tickets, issues, or other signals your team handles</small>
          </label>
        </div>

        {isAnalyzing && (
          <div className="analysis-progress">
            <div className="loading-spinner"></div>
            <p>🧠 Analyzing patterns in your data...</p>
          </div>
        )}

        {sampleSignals.length > 0 && (
          <div className="sample-preview">
            <h4>📋 Sample Preview ({sampleSignals.length} signals)</h4>
            <div className="sample-list">
              {sampleSignals.slice(0, 5).map((signal, index) => (
                <div key={index} className="sample-item">
                  <strong>{signal.title}</strong>
                </div>
              ))}
              {sampleSignals.length > 5 && <p>...and {sampleSignals.length - 5} more</p>}
            </div>
          </div>
        )}

        {patternSuggestions.length > 0 && (
          <div className="pattern-analysis-results">
            <h4>🎯 Pattern Analysis Results</h4>
            <p>{patternSuggestions.length} category suggestions generated based on your data</p>
            
            {similarTeams.length > 0 && (
              <div className="similar-teams">
                <h5>👥 Similar Teams Found</h5>
                {similarTeams.map(team => (
                  <div key={team.teamName} className="similar-team">
                    <strong>{team.teamName}</strong>
                    <span className="similarity-score">
                      {(team.similarityScore * 100).toFixed(0)}% similar
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="wizard-step">
      <h3>🏷️ Category Configuration</h3>
      <p>Choose from AI-suggested categories or create your own.</p>
      
      {patternSuggestions.length > 0 && (
        <div className="suggestions-section">
          <h4>🤖 AI Suggestions</h4>
          <div className="suggestions-grid">
            {patternSuggestions.map((suggestion) => (
              <div 
                key={suggestion.categoryName} 
                className={`suggestion-card ${selectedSuggestions.has(suggestion.categoryName) ? 'selected' : ''}`}
                onClick={() => {
                  const newSelected = new Set(selectedSuggestions);
                  if (newSelected.has(suggestion.categoryName)) {
                    newSelected.delete(suggestion.categoryName);
                  } else {
                    newSelected.add(suggestion.categoryName);
                  }
                  setSelectedSuggestions(newSelected);
                }}
              >
                <div className="suggestion-header">
                  <strong>{suggestion.categoryName}</strong>
                  <span className="confidence-badge">
                    {(suggestion.confidence * 100).toFixed(0)}% confident
                  </span>
                </div>
                <p className="suggestion-description">{suggestion.description}</p>
                <div className="keywords-preview">
                  <strong>Keywords:</strong> {suggestion.keywords.join(', ')}
                </div>
                <div className="sample-signals">
                  <strong>Example signals:</strong>
                  <ul>
                    {suggestion.sampleSignals.slice(0, 2).map((signal, index) => (
                      <li key={index}>{signal}</li>
                    ))}
                  </ul>
                </div>
                <small className="reasoning">{suggestion.reasoningExplanation}</small>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="custom-categories-section">
        <div className="section-header">
          <h4>➕ Custom Categories</h4>
          <button onClick={addCustomCategory} className="add-button">
            Add Custom Category
          </button>
        </div>
        
        {customCategories.map((category, index) => (
          <div key={index} className="custom-category-form">
            <div className="category-inputs">
              <input
                type="text"
                placeholder="Category name"
                value={category.name}
                onChange={(e) => updateCustomCategory(index, 'name', e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Display name"
                value={category.displayName}
                onChange={(e) => updateCustomCategory(index, 'displayName', e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Keywords (comma-separated)"
                value={category.keywords.join(', ')}
                onChange={(e) => handleKeywordInput(index, e.target.value)}
                className="form-input keywords-input"
              />
              <button 
                onClick={() => removeCustomCategory(index)}
                className="remove-button"
              >
                ❌
              </button>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={category.description}
              onChange={(e) => updateCustomCategory(index, 'description', e.target.value)}
              className="form-textarea"
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="wizard-step">
      <h3>🔌 Data Sources</h3>
      <p>Configure how your team's signals will be collected (optional for now).</p>
      
      <div className="datasource-options">
        <div className="datasource-card">
          <h4>📊 CSV Import</h4>
          <p>Regular CSV file imports from your ticketing system</p>
          <label>
            <input type="checkbox" /> Enable CSV import
          </label>
        </div>
        
        <div className="datasource-card">
          <h4>🔗 Jira Integration</h4>
          <p>Direct connection to Jira for real-time signal collection</p>
          <label>
            <input type="checkbox" /> Enable Jira integration
          </label>
        </div>
        
        <div className="datasource-card">
          <h4>💬 Teams/Slack Integration</h4>
          <p>Monitor team channels for support signals</p>
          <label>
            <input type="checkbox" /> Enable chat integration
          </label>
        </div>
      </div>
      
      <div className="info-note">
        <p>💡 <strong>Tip:</strong> Data sources can be configured later in the team settings. You can start with manual CSV imports and add integrations as needed.</p>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const finalCategories = generateFinalCategories();
    
    return (
      <div className="wizard-step">
        <h3>⚙️ Triage Settings</h3>
        <p>Configure how signals will be scored and prioritized.</p>
        
        <div className="settings-section">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={enableManualScoring}
                onChange={(e) => setEnableManualScoring(e.target.checked)}
              />
              Enable manual scoring
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="default-score">Default Score (1-10)</label>
            <input
              type="number"
              id="default-score"
              min="1"
              max="10"
              value={defaultScore}
              onChange={(e) => setDefaultScore(Number(e.target.value))}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>High Priority Categories</label>
            <div className="category-checkboxes">
              {finalCategories.map(category => (
                <label key={category.name}>
                  <input
                    type="checkbox"
                    checked={highPriorityCategories.includes(category.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setHighPriorityCategories([...highPriorityCategories, category.name]);
                      } else {
                        setHighPriorityCategories(highPriorityCategories.filter(c => c !== category.name));
                      }
                    }}
                  />
                  {category.displayName}
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="team-summary">
          <h4>📋 Team Summary</h4>
          <div className="summary-details">
            <p><strong>Team:</strong> {displayName}</p>
            <p><strong>Categories:</strong> {finalCategories.length}</p>
            <p><strong>High Priority:</strong> {highPriorityCategories.length}</p>
            <p><strong>Manual Scoring:</strong> {enableManualScoring ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="new-team-wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2>🚀 New Team Setup Wizard</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {renderStepIndicator()}
        
        <div className="wizard-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>
        
        <div className="wizard-actions">
          {currentStep > 1 && (
            <button 
              className="action-button secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button 
              className="action-button primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
            >
              Next →
            </button>
          ) : (
            <button 
              className="action-button primary"
              onClick={handleCreateTeam}
              disabled={!canProceedToNextStep()}
            >
              🎉 Create Team
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTeamWizard;
