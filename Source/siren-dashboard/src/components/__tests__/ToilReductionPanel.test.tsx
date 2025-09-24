import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ToilReductionPanel from '../ToilReductionPanel';

describe('ToilReductionPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders panel header correctly', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('🎯 Toil Reduction Priorities')).toBeInTheDocument();
      expect(screen.getByText('Focus areas to reduce recurring support burden')).toBeInTheDocument();
    });

    test('displays loading state when loading prop is true', () => {
      render(<ToilReductionPanel loading={true} />);

      expect(screen.getByText('Loading toil reduction insights...')).toBeInTheDocument();
      expect(screen.queryByText('🎯 Toil Reduction Priorities')).not.toBeInTheDocument();
    });

    test('has correct loading class when loading', () => {
      render(<ToilReductionPanel loading={true} />);
      
      expect(document.querySelector('.toil-reduction-panel.loading')).toBeInTheDocument();
    });

    test('renders all mock toil items', () => {
      render(<ToilReductionPanel loading={false} />);

      // Check that all 3 mock items are rendered
      expect(screen.getByText('Authentication Token Renewal Issues')).toBeInTheDocument();
      expect(screen.getByText('Email Delivery Delays')).toBeInTheDocument();
      expect(screen.getByText('PDF Generation Timeouts')).toBeInTheDocument();
    });

    test('displays correct item rankings', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    test('displays correct priority scores', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('8.5')).toBeInTheDocument(); // Authentication issue
      expect(screen.getByText('6.8')).toBeInTheDocument(); // Email issue
      expect(screen.getByText('4.2')).toBeInTheDocument(); // PDF issue
    });

    test('displays correct categories', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('Authentication')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    test('displays correct discovery times', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });

    test('displays correct recurrence counts and effort estimates', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('8 tickets')).toBeInTheDocument();
      expect(screen.getByText('5 tickets')).toBeInTheDocument();
      expect(screen.getByText('3 tickets')).toBeInTheDocument();

      expect(screen.getByText('5h est.')).toBeInTheDocument();
      expect(screen.getByText('3h est.')).toBeInTheDocument();
      expect(screen.getByText('2h est.')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    test('displays correct status icons', () => {
      render(<ToilReductionPanel loading={false} />);

      // Check status indicators are present
      const statusIndicators = document.querySelectorAll('.status-indicator');
      expect(statusIndicators).toHaveLength(3);

      // Check for specific status classes
      expect(document.querySelector('.status-indicator.not-started')).toBeInTheDocument();
      expect(document.querySelector('.status-indicator.in-progress')).toBeInTheDocument();
      expect(document.querySelector('.status-indicator.complete')).toBeInTheDocument();
    });

    test('displays correct status classes on toil items', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(document.querySelector('.toil-item.not-started')).toBeInTheDocument();
      expect(document.querySelector('.toil-item.in-progress')).toBeInTheDocument();
      expect(document.querySelector('.toil-item.complete')).toBeInTheDocument();
    });

    test('displays correct priority badge classes', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(document.querySelector('.priority-badge.critical')).toBeInTheDocument(); // 8.5 score
      expect(document.querySelector('.priority-badge.high')).toBeInTheDocument();     // 6.8 score  
      expect(document.querySelector('.priority-badge.medium')).toBeInTheDocument();   // 4.2 score
    });
  });

  describe('Item Expansion', () => {
    test('initially shows expand arrows (not expanded)', () => {
      render(<ToilReductionPanel loading={false} />);

      const expandIcons = screen.getAllByText('▶');
      expect(expandIcons).toHaveLength(3); // All items should show expand arrow initially
    });

    test('expands item when clicked', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItem = screen.getByText('Authentication Token Renewal Issues');
      fireEvent.click(firstItem.closest('.toil-item-header'));

      // Should show collapse arrow
      expect(screen.getByText('▼')).toBeInTheDocument();
      
      // Should show detailed information
      expect(screen.getByText('📊 Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('🔍 Pattern Analysis')).toBeInTheDocument();
    });

    test('shows detailed metrics when expanded', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItem = screen.getByText('Authentication Token Renewal Issues');
      fireEvent.click(firstItem.closest('.toil-item-header'));

      // Check impact metrics
      expect(screen.getByText('Time spent:')).toBeInTheDocument();
      expect(screen.getByText('12h this month')).toBeInTheDocument();
      expect(screen.getByText('Potential savings:')).toBeInTheDocument();
      expect(screen.getByText('4h/week')).toBeInTheDocument();
      expect(screen.getByText('Business impact:')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Trend:')).toBeInTheDocument();
      expect(screen.getByText(/Increasing/)).toBeInTheDocument();
    });

    test('shows pattern analysis when expanded', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItem = screen.getByText('Authentication Token Renewal Issues');
      fireEvent.click(firstItem.closest('.toil-item-header'));

      // Check pattern insights
      expect(screen.getByText('Users repeatedly fail token refresh after 24hrs, causing multiple support tickets')).toBeInTheDocument();
      expect(screen.getByText('Common keywords:')).toBeInTheDocument();
      expect(screen.getByText('token')).toBeInTheDocument();
      expect(screen.getByText('expired')).toBeInTheDocument();
      expect(screen.getByText('refresh')).toBeInTheDocument();
      expect(screen.getByText('401')).toBeInTheDocument();
    });

    test('shows additional context info when expanded', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItem = screen.getByText('Authentication Token Renewal Issues');
      fireEvent.click(firstItem.closest('.toil-item-header'));

      expect(screen.getByText(/Last occurrence:/)).toBeInTheDocument();
      expect(screen.getByText('Avg manual score: 7.2')).toBeInTheDocument();
      expect(screen.getByText('Team notes: Affects primarily mobile users')).toBeInTheDocument();
    });

    test('collapses item when clicked again', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      
      // Expand
      fireEvent.click(firstItemHeader);
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText('📊 Impact Analysis')).toBeInTheDocument();

      // Collapse
      fireEvent.click(firstItemHeader);
      const expandIcons = screen.getAllByText('▶');
      expect(expandIcons.length).toBeGreaterThan(0);
      expect(screen.queryByText('📊 Impact Analysis')).not.toBeInTheDocument();
    });

    test('only one item can be expanded at a time', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');

      // Expand first item
      fireEvent.click(firstItemHeader);
      expect(screen.getByText('Users repeatedly fail token refresh after 24hrs, causing multiple support tickets')).toBeInTheDocument();

      // Expand second item - should close first
      fireEvent.click(secondItemHeader);
      expect(screen.queryByText('Users repeatedly fail token refresh after 24hrs, causing multiple support tickets')).not.toBeInTheDocument();
      expect(screen.getByText('Email notifications delayed by 15-30 minutes during peak hours')).toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    test('shows correct action button for NotStarted status', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand the first item (NotStarted status)
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);

      expect(screen.getByText('🏗️ Start Working')).toBeInTheDocument();
    });

    test('shows correct action button for InProgress status', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand the second item (InProgress status)
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);

      expect(screen.getByText('✅ Mark Complete')).toBeInTheDocument();
    });

    test('shows correct action button for Complete status', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand the third item (Complete status)
      const thirdItemHeader = screen.getByText('PDF Generation Timeouts').closest('.toil-item-header');
      fireEvent.click(thirdItemHeader);

      expect(screen.getByText('🔄 Reopen')).toBeInTheDocument();
    });

    test('changes status from NotStarted to InProgress when Start Working clicked', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand first item and click Start Working
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);
      
      const startButton = screen.getByText('🏗️ Start Working');
      fireEvent.click(startButton);

      // Should now show Mark Complete button instead
      expect(screen.getByText('✅ Mark Complete')).toBeInTheDocument();
      expect(screen.queryByText('🏗️ Start Working')).not.toBeInTheDocument();

      // Status indicator should change to in-progress
      const toilItem = document.querySelector('.toil-item:first-child');
      expect(toilItem).toHaveClass('in-progress');
      expect(toilItem).not.toHaveClass('not-started');
    });

    test('changes status from InProgress to Complete when Mark Complete clicked', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand second item and click Mark Complete
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);
      
      const completeButton = screen.getByText('✅ Mark Complete');
      fireEvent.click(completeButton);

      // Should now show Reopen button instead
      expect(screen.getByText('🔄 Reopen')).toBeInTheDocument();
      expect(screen.queryByText('✅ Mark Complete')).not.toBeInTheDocument();

      // Status indicator should change to complete
      const toilItems = document.querySelectorAll('.toil-item');
      const emailItem = toilItems[1]; // Second item
      expect(emailItem).toHaveClass('complete');
      expect(emailItem).not.toHaveClass('in-progress');
    });

    test('changes status from Complete to NotStarted when Reopen clicked', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand third item and click Reopen
      const thirdItemHeader = screen.getByText('PDF Generation Timeouts').closest('.toil-item-header');
      fireEvent.click(thirdItemHeader);
      
      const reopenButton = screen.getByText('🔄 Reopen');
      fireEvent.click(reopenButton);

      // Should now show Start Working button instead
      expect(screen.getByText('🏗️ Start Working')).toBeInTheDocument();
      expect(screen.queryByText('🔄 Reopen')).not.toBeInTheDocument();

      // Status indicator should change to not-started
      const toilItems = document.querySelectorAll('.toil-item');
      const pdfItem = toilItems[2]; // Third item
      expect(pdfItem).toHaveClass('not-started');
      expect(pdfItem).not.toHaveClass('complete');
    });

    test('shows View Related Signals button for all items', () => {
      render(<ToilReductionPanel loading={false} />);

      // Check each item
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);
      expect(screen.getByText('📋 View Related Signals (3)')).toBeInTheDocument();

      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);
      expect(screen.getByText('📋 View Related Signals (2)')).toBeInTheDocument();

      const thirdItemHeader = screen.getByText('PDF Generation Timeouts').closest('.toil-item-header');
      fireEvent.click(thirdItemHeader);
      expect(screen.getByText('📋 View Related Signals (1)')).toBeInTheDocument();
    });
  });

  describe('Footer Statistics', () => {
    test('displays correct initial statistics', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(screen.getByText('Items in progress:')).toBeInTheDocument();
      expect(screen.getByText('Potential weekly savings:')).toBeInTheDocument();
      
      // Initially 1 item in progress (Email Delivery Delays)
      const progressStat = screen.getByText('Items in progress:').parentElement;
      expect(progressStat).toHaveTextContent('1');
      
      // Total potential savings: 4 + 2 + 1 = 7h
      const savingsStat = screen.getByText('Potential weekly savings:').parentElement;
      expect(savingsStat).toHaveTextContent('7h');
    });

    test('updates statistics when item status changes', () => {
      render(<ToilReductionPanel loading={false} />);

      // Start working on first item (NotStarted -> InProgress)
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);
      fireEvent.click(screen.getByText('🏗️ Start Working'));

      // Should now have 2 items in progress
      const progressStat = screen.getByText('Items in progress:').parentElement;
      expect(progressStat).toHaveTextContent('2');
    });

    test('calculates total potential savings correctly', () => {
      render(<ToilReductionPanel loading={false} />);

      // Potential savings should be sum of all items: 4 + 2 + 1 = 7
      const savingsStat = screen.getByText('Potential weekly savings:').parentElement;
      expect(savingsStat).toHaveTextContent('7h');
    });
  });

  describe('Trend Icons', () => {
    test('displays correct trend icons when items are expanded', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand first item (Increasing trend)
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);
      expect(screen.getByText('↗️ Increasing')).toBeInTheDocument();

      // Expand second item (Stable trend)
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);
      expect(screen.getByText('➡️ Stable')).toBeInTheDocument();

      // Expand third item (Decreasing trend)
      const thirdItemHeader = screen.getByText('PDF Generation Timeouts').closest('.toil-item-header');
      fireEvent.click(thirdItemHeader);
      expect(screen.getByText('↘️ Decreasing')).toBeInTheDocument();
    });
  });

  describe('Business Impact Levels', () => {
    test('displays correct business impact classes and values', () => {
      render(<ToilReductionPanel loading={false} />);

      // Check High impact (first item)
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);
      const highImpact = document.querySelector('.impact-high');
      expect(highImpact).toBeInTheDocument();
      expect(highImpact).toHaveTextContent('High');

      // Check Medium impact (second item)
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);
      const mediumImpact = document.querySelector('.impact-medium');
      expect(mediumImpact).toBeInTheDocument();
      expect(mediumImpact).toHaveTextContent('Medium');

      // Check Low impact (third item)
      const thirdItemHeader = screen.getByText('PDF Generation Timeouts').closest('.toil-item-header');
      fireEvent.click(thirdItemHeader);
      const lowImpact = document.querySelector('.impact-low');
      expect(lowImpact).toBeInTheDocument();
      expect(lowImpact).toHaveTextContent('Low');
    });
  });

  describe('Keyword Tags', () => {
    test('displays keyword tags correctly when item expanded', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);

      // Check that all keywords are displayed as tags
      const keywordTags = document.querySelectorAll('.keyword-tag');
      expect(keywordTags).toHaveLength(4);
      
      const keywordTexts = Array.from(keywordTags).map(tag => tag.textContent);
      expect(keywordTexts).toEqual(['token', 'expired', 'refresh', '401']);
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<ToilReductionPanel loading={false} />);

      const mainHeading = screen.getByRole('heading', { level: 3, name: '🎯 Toil Reduction Priorities' });
      expect(mainHeading).toBeInTheDocument();

      // Expand an item to see sub-headings
      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);

      const itemTitle = screen.getByRole('heading', { level: 4, name: 'Authentication Token Renewal Issues' });
      expect(itemTitle).toBeInTheDocument();

      const impactHeading = screen.getByRole('heading', { level: 5, name: '📊 Impact Analysis' });
      expect(impactHeading).toBeInTheDocument();

      const patternHeading = screen.getByRole('heading', { level: 5, name: '🔍 Pattern Analysis' });
      expect(patternHeading).toBeInTheDocument();
    });

    test('buttons have accessible text', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);

      const startButton = screen.getByRole('button', { name: '🏗️ Start Working' });
      expect(startButton).toBeInTheDocument();

      const viewButton = screen.getByRole('button', { name: '📋 View Related Signals (3)' });
      expect(viewButton).toBeInTheDocument();
    });

    test('has proper semantic structure', () => {
      render(<ToilReductionPanel loading={false} />);

      expect(document.querySelector('.toil-reduction-panel')).toBeInTheDocument();
      expect(document.querySelector('.panel-header')).toBeInTheDocument();
      expect(document.querySelector('.toil-items')).toBeInTheDocument();
      expect(document.querySelector('.panel-footer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing team notes gracefully', () => {
      render(<ToilReductionPanel loading={false} />);

      // Expand second item which has no team notes
      const secondItemHeader = screen.getByText('Email Delivery Delays').closest('.toil-item-header');
      fireEvent.click(secondItemHeader);

      // Should not show team notes section
      expect(screen.queryByText(/Team notes:/)).not.toBeInTheDocument();
    });

    test('formats dates correctly', () => {
      render(<ToilReductionPanel loading={false} />);

      const firstItemHeader = screen.getByText('Authentication Token Renewal Issues').closest('.toil-item-header');
      fireEvent.click(firstItemHeader);

      // Should show formatted date
      const dateRegex = /Last occurrence: \d{1,2}\/\d{1,2}\/\d{4}/;
      expect(screen.getByText(dateRegex)).toBeInTheDocument();
    });

    test('handles zero potential savings', () => {
      render(<ToilReductionPanel loading={false} />);

      // The component should handle if potential savings were 0
      const savingsStat = screen.getByText('Potential weekly savings:').parentElement;
      expect(savingsStat).toHaveTextContent('7h'); // Current sum is 7
    });
  });
});
