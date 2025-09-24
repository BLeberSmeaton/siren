import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTeamWizard from '../NewTeamWizard';
import { TeamConfiguration } from '../../types';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock file reading - create a better mock
const mockFileText = jest.fn();
Object.defineProperty(File.prototype, 'text', {
  value: mockFileText,
  writable: true,
  configurable: true,
});

describe('NewTeamWizard', () => {
  const mockProps = {
    onClose: jest.fn(),
    onTeamCreated: jest.fn(),
    existingTeams: ['team-api', 'team-infrastructure']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockFileText.mockResolvedValue('title,description,source,timestamp\nAPI issue,Endpoint timeout,Jira,2023-01-01\nCert problem,Certificate expiry,Teams,2023-01-02');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to navigate to step 3
  const navigateToStep3 = async () => {
    // Fill step 1
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    // Mock API response and upload file for step 2
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestedCategories: [], similarTeams: [] })
    });
    
    const file = new File(['title,description,source,timestamp\nTest issue,Test description,CSV,2023-01-01'], 'sample.csv', { type: 'text/csv' });
    
    await act(async () => {
      await userEvent.upload(screen.getByTestId('file-upload-input'), file);
    });
    
    // Wait for analysis to complete (might skip loading state if fast)
    await waitFor(() => {
      const nextButton = screen.getByText('Next →');
      expect(nextButton).toBeEnabled();
    }, { timeout: 10000 });
    
    await userEvent.click(screen.getByText('Next →'));
    
    // Verify we're on step 3
    expect(screen.getByText('🏷️ Category Configuration')).toBeInTheDocument();
  };

  it('renders initial step with team information form', () => {
    render(<NewTeamWizard {...mockProps} />);
    
    expect(screen.getByText('🚀 New Team Setup Wizard')).toBeInTheDocument();
    expect(screen.getByText('🏷️ Team Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Team Name (used internally)')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description (optional)')).toBeInTheDocument();
  });

  it('shows step indicator with correct current step', () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // More specific selector to avoid matching headings
    const stepTitles = screen.getAllByTestId('step-title');
    expect(stepTitles).toHaveLength(5);
    
    // First step should be active
    const step1 = screen.getByText('Team Info').closest('.step');
    expect(step1).toHaveClass('active');
  });

  it('validates team name and display name before allowing next step', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
    
    // Fill in team name only
    const teamNameInput = screen.getByLabelText('Team Name (used internally)');
    await userEvent.type(teamNameInput, 'team-payments');
    expect(nextButton).toBeDisabled();
    
    // Fill in display name
    const displayNameInput = screen.getByLabelText('Display Name');
    await userEvent.type(displayNameInput, 'Payments Team');
    expect(nextButton).toBeEnabled();
  });

  it('advances to step 2 when team info is valid', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Fill required fields
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    
    // Click next
    await userEvent.click(screen.getByText('Next →'));
    
    expect(screen.getByText('📊 Sample Data Analysis')).toBeInTheDocument();
    expect(screen.getByText('Upload a sample of your team\'s support signals to get intelligent category suggestions.')).toBeInTheDocument();
  });

  it('handles CSV file upload and shows sample preview', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 2
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestedCategories: [
          {
            categoryName: 'API Issues',
            description: 'API endpoint problems',
            keywords: ['api', 'endpoint', 'timeout'],
            confidence: 0.85,
            sampleSignals: ['API timeout occurred'],
            reasoningExplanation: 'High frequency API terms detected'
          }
        ],
        similarTeams: [
          {
            teamName: 'team-api',
            similarityScore: 0.7,
            commonPatterns: ['api', 'endpoint']
          }
        ]
      })
    });

    // Create and upload a mock file
    const file = new File(['title,description,source,timestamp\nAPI issue,Timeout,Jira,2023-01-01'], 'sample.csv', {
      type: 'text/csv'
    });
    
    const fileInput = screen.getByTestId('file-upload-input');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/📋 Sample Preview/)).toBeInTheDocument();
      expect(screen.getByText(/2 signals/)).toBeInTheDocument();
    });
  });

  // it('shows pattern analysis results after file upload', async () => {
  //   render(<NewTeamWizard {...mockProps} />);
    
  //   // Navigate to step 2
  //   await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
  //   await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
  //   await userEvent.click(screen.getByText('Next →'));
    
  //   // Mock successful API response
  //   mockFetch.mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => ({
  //       suggestedCategories: [
  //         {
  //           categoryName: 'API Issues',
  //           description: 'API endpoint problems',
  //           keywords: ['api', 'endpoint'],
  //           confidence: 0.85,
  //           sampleSignals: ['API timeout'],
  //           reasoningExplanation: 'Strong API patterns found'
  //         }
  //       ],
  //       similarTeams: []
  //     })
  //   });

  //   const file = new File(['title,description\nAPI issue,Timeout'], 'sample.csv', { type: 'text/csv' });
  //   const fileInput = screen.getByTestId('file-upload-input');
  //   await userEvent.upload(fileInput, file);

  //   await waitFor(() => {
  //     expect(screen.getByText('🎯 Pattern Analysis Results')).toBeInTheDocument();
  //     expect(screen.getByText('1 category suggestions generated')).toBeInTheDocument();
  //   });
  // });

  // it('shows similar teams when found', async () => {
  //   render(<NewTeamWizard {...mockProps} />);
    
  //   // Navigate to step 2
  //   await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
  //   await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
  //   await userEvent.click(screen.getByText('Next →'));
    
  //   // Mock API response with similar teams
  //   mockFetch.mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => ({
  //       suggestedCategories: [],
  //       similarTeams: [
  //         {
  //           teamName: 'team-api',
  //           similarityScore: 0.8,
  //           commonPatterns: ['api', 'endpoint']
  //         }
  //       ]
  //     })
  //   });

  //   const file = new File(['title\nAPI issue'], 'sample.csv', { type: 'text/csv' });
  //   const fileInput = screen.getByTestId('file-upload-input');
  //   await userEvent.upload(fileInput, file);

  //   await waitFor(() => {
  //     expect(screen.getByText('👥 Similar Teams Found')).toBeInTheDocument();
  //     expect(screen.getByText('team-api')).toBeInTheDocument();
  //     expect(screen.getByText('80% similar')).toBeInTheDocument();
  //   });
  // });

  it('allows proceeding to step 3 with sample data', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate through steps
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    // Mock successful API response for file analysis
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestedCategories: [],
        similarTeams: []
      })
    });

    // Mock file upload
    const file = new File(['title\nAPI issue'], 'sample.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-upload-input');
    await userEvent.upload(fileInput, file);

    // Wait for the analysis to complete and Next button to be enabled
    await waitFor(() => {
      const nextButton = screen.getByText('Next →');
      expect(nextButton).toBeEnabled();
    }, { timeout: 5000 });

    await userEvent.click(screen.getByText('Next →'));
    expect(screen.getByText('🏷️ Category Configuration')).toBeInTheDocument();
  });

  it('displays AI suggestions in step 3', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 3 with suggestions
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestedCategories: [
          {
            categoryName: 'Payment Issues',
            description: 'Payment processing problems',
            keywords: ['payment', 'stripe', 'charge'],
            confidence: 0.9,
            sampleSignals: ['Payment failed', 'Charge declined'],
            reasoningExplanation: 'Strong payment processing patterns detected'
          }
        ]
      })
    });

    const file = new File(['title\nPayment failed'], 'sample.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByTestId('file-upload-input'), file);
    
    await waitFor(() => {
      expect(screen.getByText('Next →')).toBeEnabled();
    });
    
    await userEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('🤖 AI Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Payment Issues')).toBeInTheDocument();
    expect(screen.getByText('90% confident')).toBeInTheDocument();
  });

  // it('allows selecting AI suggestions', async () => {
  //   render(<NewTeamWizard {...mockProps} />);
    
  //   // Navigate to step 3 with suggestions
  //   await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
  //   await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
  //   await userEvent.click(screen.getByText('Next →'));
    
  //   mockFetch.mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => ({
  //       suggestedCategories: [
  //         {
  //           categoryName: 'API Issues',
  //           description: 'API problems',
  //           keywords: ['api', 'endpoint'],
  //           confidence: 0.8,
  //           sampleSignals: [],
  //           reasoningExplanation: 'API patterns found'
  //         }
  //       ]
  //     })
  //   });

  //   const file = new File(['title\nAPI issue'], 'sample.csv', { type: 'text/csv' });
  //   await userEvent.upload(screen.getByTestId('file-upload-input'), file);
  //   await userEvent.click(screen.getByText('Next →'));

  //   // Click on suggestion to select it
  //   const suggestionCard = screen.getByText('API Issues').closest('.suggestion-card');
  //   expect(suggestionCard).not.toHaveClass('selected');
    
  //   await userEvent.click(suggestionCard!);
  //   expect(suggestionCard).toHaveClass('selected');
  // });

  it('allows adding custom categories', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 3
    await navigateToStep3();

    // Add custom category
    await userEvent.click(screen.getByText('Add Custom Category'));
    
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Keywords (comma-separated)')).toBeInTheDocument();
  });

  it('validates custom category input', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 3
    await navigateToStep3();

    // Add and fill custom category
    await userEvent.click(screen.getByText('Add Custom Category'));
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Security');
    await userEvent.type(screen.getByPlaceholderText('Display name'), 'Security Issues');
    await userEvent.type(screen.getByPlaceholderText('Keywords (comma-separated)'), 'security, vulnerability, breach');

    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeEnabled();
  });

  it('shows data source options in step 4', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 4
    await navigateToStep3();
    
    // Add a custom category to proceed
    await userEvent.click(screen.getByText('Add Custom Category'));
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Keywords (comma-separated)'), 'test, testing');
    await userEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('🔌 Data Sources')).toBeInTheDocument();
    expect(screen.getByText('📊 CSV Import')).toBeInTheDocument();
    expect(screen.getByText('🔗 Jira Integration')).toBeInTheDocument();
    expect(screen.getByText('💬 Teams/Slack Integration')).toBeInTheDocument();
  });

  it('shows triage settings in step 5', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 5
    await navigateToStep3();
    
    await userEvent.click(screen.getByText('Add Custom Category'));
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Keywords (comma-separated)'), 'test');
    await userEvent.click(screen.getByText('Next →'));
    await userEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('⚙️ Triage Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable manual scoring')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Score (1-10)')).toBeInTheDocument();
  });

  it('creates team when all steps completed', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate through all steps
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.type(screen.getByLabelText('Description (optional)'), 'Test description');
    await userEvent.click(screen.getByText('Next →'));
    
    // Step 2 - Upload and wait for analysis
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestedCategories: [], similarTeams: [] })
    });
    
    const file = new File(['title\nTest'], 'sample.csv', { type: 'text/csv' });
    await userEvent.upload(screen.getByTestId('file-upload-input'), file);
    
    await waitFor(() => {
      expect(screen.getByText('Next →')).toBeEnabled();
    }, { timeout: 5000 });
    
    await userEvent.click(screen.getByText('Next →'));
    
    // Step 3 - Add custom category
    await userEvent.click(screen.getByText('Add Custom Category'));
    await userEvent.type(screen.getByPlaceholderText('Category name'), 'Testing');
    await userEvent.type(screen.getByPlaceholderText('Display name'), 'Testing Issues');
    await userEvent.type(screen.getByPlaceholderText('Keywords (comma-separated)'), 'test, bug, issue');
    await userEvent.click(screen.getByText('Next →'));
    await userEvent.click(screen.getByText('Next →'));

    // Final step - create team
    const createButton = screen.getByText('🎉 Create Team');
    expect(createButton).toBeEnabled();
    
    await userEvent.click(createButton);

    expect(mockProps.onTeamCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        teamName: 'team-test',
        displayName: 'Test Team',
        description: 'Test description',
        categories: expect.arrayContaining([
          expect.objectContaining({
            name: 'Testing',
            displayName: 'Testing Issues',
            keywords: expect.any(Array)
          })
        ])
      })
    );
  });

  it('allows going back to previous steps', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate forward
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    expect(screen.getByText('📊 Sample Data Analysis')).toBeInTheDocument();
    
    // Go back
    await userEvent.click(screen.getByText('← Previous'));
    expect(screen.getByText('🏷️ Team Information')).toBeInTheDocument();
  });

  it('closes wizard when close button clicked', async () => {
    render(<NewTeamWizard {...mockProps} />);
    
    await userEvent.click(screen.getByText('×'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles API error during pattern analysis gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<NewTeamWizard {...mockProps} />);
    
    // Navigate to step 2
    await userEvent.type(screen.getByLabelText('Team Name (used internally)'), 'team-test');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test Team');
    await userEvent.click(screen.getByText('Next →'));
    
    // Mock API failure
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    const file = new File(['title\nTest'], 'sample.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-upload-input');
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to analyze sample data:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
