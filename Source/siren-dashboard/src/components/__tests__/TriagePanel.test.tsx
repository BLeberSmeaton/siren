import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TriagePanel from '../TriagePanel';
import { SupportSignal } from '../../types';
import { signalsApi, categoriesApi } from '../../services/api';

// Mock the API modules
jest.mock('../../services/api', () => ({
  signalsApi: {
    updateManualScore: jest.fn()
  },
  categoriesApi: {
    getCategories: jest.fn(),
    categorizeSignal: jest.fn()
  }
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

const mockSignal: SupportSignal = {
  id: 'test-signal-1',
  title: 'Test Signal Title',
  description: 'This is a test signal description for testing the triage panel functionality.',
  source: 'Test Source',
  timestamp: '2023-12-01T10:00:00Z',
  category: 'Bug Report',
  manualScore: 6
};

const mockSignalUncategorized: SupportSignal = {
  id: 'test-signal-2',
  title: 'Uncategorized Signal',
  description: 'This signal has no category assigned.',
  source: 'Email',
  timestamp: '2023-12-02T14:30:00Z',
  category: undefined,
  manualScore: undefined
};

const mockCategories = ['Bug Report', 'Feature Request', 'Support Question', 'Documentation'];

const mockOnClose = jest.fn();
const mockOnSignalUpdated = jest.fn();

describe('TriagePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (categoriesApi.getCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  describe('Rendering', () => {
    test('renders triage panel with signal data', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByText('🎯 Manual Triage')).toBeInTheDocument();
      expect(screen.getByText('Test Signal Title')).toBeInTheDocument();
      expect(screen.getByText('This is a test signal description for testing the triage panel functionality.')).toBeInTheDocument();
      expect(screen.getByText('Source: Test Source')).toBeInTheDocument();
      expect(screen.getByText(/Updated:/)).toBeInTheDocument();

      // Wait for categories to load
      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });
    });

    test('does not render when signal is null', () => {
      const { container } = render(
        <TriagePanel 
          signal={null} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('renders AI analysis section correctly', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByText('🤖 AI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Category:')).toBeInTheDocument();
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Re-analyze')).toBeInTheDocument();
    });

    test('displays "Uncategorized" for signals without category', () => {
      render(
        <TriagePanel 
          signal={mockSignalUncategorized} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });

    test('renders human assessment form correctly', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByText('👨‍💼 Human Assessment')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority Score (1-10):')).toBeInTheDocument();
      expect(screen.getByLabelText('Manual Category Override:')).toBeInTheDocument();
      expect(screen.getByLabelText('Triage Notes:')).toBeInTheDocument();
    });

    test('displays correct initial values from signal', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const scoreSlider = screen.getByLabelText('Priority Score (1-10):') as HTMLInputElement;
      expect(scoreSlider.value).toBe('6'); // From mockSignal.manualScore

      expect(screen.getByText('6.0')).toBeInTheDocument(); // Score display
    });

    test('displays default values for signal without scores', () => {
      render(
        <TriagePanel 
          signal={mockSignalUncategorized} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const scoreSlider = screen.getByLabelText('Priority Score (1-10):') as HTMLInputElement;
      expect(scoreSlider.value).toBe('5'); // Default value

      expect(screen.getByText('5.0')).toBeInTheDocument(); // Default score display
    });
  });

  describe('User Interactions', () => {
    test('updates manual score when slider changes', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const scoreSlider = screen.getByLabelText('Priority Score (1-10):');
      fireEvent.change(scoreSlider, { target: { value: '8' } });

      expect(screen.getByText('8.0')).toBeInTheDocument();
    });

    test('updates category when dropdown selection changes', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      // Wait for categories to load
      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });

      const categorySelect = screen.getByLabelText('Manual Category Override:');
      fireEvent.change(categorySelect, { target: { value: 'Feature Request' } });

      expect((categorySelect as HTMLSelectElement).value).toBe('Feature Request');
    });

    test('updates triage notes when textarea changes', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const notesTextarea = screen.getByLabelText('Triage Notes:');
      fireEvent.change(notesTextarea, { target: { value: 'This is a critical issue affecting multiple users.' } });

      expect(notesTextarea).toHaveValue('This is a critical issue affecting multiple users.');
    });

    test('calls onClose when close button is clicked', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when cancel button is clicked', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const cancelButton = screen.getByText('❌ Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Score Classification', () => {
    test('displays correct score badges for different ranges', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const scoreSlider = screen.getByLabelText('Priority Score (1-10):');

      // Test high score (8+)
      fireEvent.change(scoreSlider, { target: { value: '9' } });
      expect(document.querySelector('.score-badge.high')).toBeInTheDocument();

      // Test medium-high score (6-7)
      fireEvent.change(scoreSlider, { target: { value: '7' } });
      expect(document.querySelector('.score-badge.medium-high')).toBeInTheDocument();

      // Test medium score (4-5)
      fireEvent.change(scoreSlider, { target: { value: '4' } });
      expect(document.querySelector('.score-badge.medium')).toBeInTheDocument();

      // Test low score (1-3)
      fireEvent.change(scoreSlider, { target: { value: '2' } });
      expect(document.querySelector('.score-badge.low')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('successfully saves triage with score and category changes', async () => {
      const updatedSignal = { ...mockSignal, manualScore: 8, category: 'Feature Request' };
      
      (signalsApi.updateManualScore as jest.Mock).mockResolvedValue(updatedSignal);
      (categoriesApi.categorizeSignal as jest.Mock).mockResolvedValue(updatedSignal);

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      // Wait for categories to load
      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalled();
      });

      // Change score
      const scoreSlider = screen.getByLabelText('Priority Score (1-10):');
      fireEvent.change(scoreSlider, { target: { value: '8' } });

      // Change category
      const categorySelect = screen.getByLabelText('Manual Category Override:');
      fireEvent.change(categorySelect, { target: { value: 'Feature Request' } });

      // Save triage
      const saveButton = screen.getByText('💾 Save Triage');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(signalsApi.updateManualScore).toHaveBeenCalledWith('test-signal-1', { score: 8 });
        expect(categoriesApi.categorizeSignal).toHaveBeenCalledWith('test-signal-1', {
          category: 'Feature Request',
          useAutoCategorization: false
        });
        expect(mockOnSignalUpdated).toHaveBeenCalledWith(updatedSignal);
        expect(mockAlert).toHaveBeenCalledWith('Manual triage completed successfully!');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('saves triage with only score changes', async () => {
      const updatedSignal = { ...mockSignal, manualScore: 7 };
      
      (signalsApi.updateManualScore as jest.Mock).mockResolvedValue(updatedSignal);

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      // Change only the score, keep same category
      const scoreSlider = screen.getByLabelText('Priority Score (1-10):');
      fireEvent.change(scoreSlider, { target: { value: '7' } });

      const saveButton = screen.getByText('💾 Save Triage');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(signalsApi.updateManualScore).toHaveBeenCalledWith('test-signal-1', { score: 7 });
        expect(categoriesApi.categorizeSignal).not.toHaveBeenCalled(); // Category unchanged
        expect(mockOnSignalUpdated).toHaveBeenCalledWith(updatedSignal);
      });
    });

    test('handles API errors gracefully during save', async () => {
      (signalsApi.updateManualScore as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const saveButton = screen.getByText('💾 Save Triage');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to save triage. Please try again.');
        expect(mockOnSignalUpdated).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    test('successfully performs auto-recategorization', async () => {
      const recategorizedSignal = { ...mockSignal, category: 'Auto-Generated Category' };
      
      (categoriesApi.categorizeSignal as jest.Mock).mockResolvedValue(recategorizedSignal);

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const reanalyzeButton = screen.getByText('Re-analyze');
      fireEvent.click(reanalyzeButton);

      await waitFor(() => {
        expect(categoriesApi.categorizeSignal).toHaveBeenCalledWith('test-signal-1', {
          useAutoCategorization: true
        });
        expect(mockOnSignalUpdated).toHaveBeenCalledWith(recategorizedSignal);
      });
    });

    test('handles auto-recategorization errors gracefully', async () => {
      (categoriesApi.categorizeSignal as jest.Mock).mockRejectedValue(new Error('Auto-categorization failed'));

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const reanalyzeButton = screen.getByText('Re-analyze');
      fireEvent.click(reanalyzeButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to auto-categorize. Please try again.');
        expect(mockOnSignalUpdated).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during save operation', async () => {
      // Mock a delayed API response
      (signalsApi.updateManualScore as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSignal), 100))
      );

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const saveButton = screen.getByText('💾 Save Triage');
      fireEvent.click(saveButton);

      expect(screen.getByText('💾 Saving...')).toBeInTheDocument();
      expect(screen.getByText('💾 Saving...')).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('💾 Save Triage')).toBeInTheDocument();
      });
    });

    test('disables re-analyze button during operation', async () => {
      (categoriesApi.categorizeSignal as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSignal), 100))
      );

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const reanalyzeButton = screen.getByText('Re-analyze');
      fireEvent.click(reanalyzeButton);

      expect(reanalyzeButton).toBeDisabled();

      await waitFor(() => {
        expect(reanalyzeButton).not.toBeDisabled();
      });
    });
  });

  describe('Categories Loading', () => {
    test('loads categories on component mount', async () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      await waitFor(() => {
        expect(categoriesApi.getCategories).toHaveBeenCalledTimes(1);
      });

      // Check that categories are populated in the dropdown
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Bug Report' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Feature Request' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Support Question' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Documentation' })).toBeInTheDocument();
      });
    });

    test('handles category loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (categoriesApi.getCategories as jest.Mock).mockRejectedValue(new Error('Failed to load categories'));

      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load categories:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Component Updates', () => {
    test('updates form when signal changes', () => {
      const { rerender } = render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByText('6.0')).toBeInTheDocument();

      const newSignal = { ...mockSignal, manualScore: 8 };
      rerender(
        <TriagePanel 
          signal={newSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

        expect(screen.getByText('8.0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByLabelText('Priority Score (1-10):')).toBeInTheDocument();
      expect(screen.getByLabelText('Manual Category Override:')).toBeInTheDocument();
      expect(screen.getByLabelText('Triage Notes:')).toBeInTheDocument();
    });

    test('has proper button accessibility', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Triage/ });
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      const closeButton = screen.getByRole('button', { name: '×' });
      const reanalyzeButton = screen.getByRole('button', { name: 'Re-analyze' });

      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
      expect(reanalyzeButton).toBeInTheDocument();
    });

    test('maintains proper heading hierarchy', () => {
      render(
        <TriagePanel 
          signal={mockSignal} 
          onClose={mockOnClose} 
          onSignalUpdated={mockOnSignalUpdated} 
        />
      );

      expect(screen.getByRole('heading', { level: 2, name: '🎯 Manual Triage' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Test Signal Title' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: '🤖 AI Analysis' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: '👨‍💼 Human Assessment' })).toBeInTheDocument();
    });
  });
});
