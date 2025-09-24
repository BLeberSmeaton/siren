import React from 'react';
import { render, screen } from '@testing-library/react';
import ReportGenerationModal from '../ReportGenerationModal';

const mockDashboardData = {
  signals: [],
  summary: null,
  categoryStats: [],
  teams: [],
  selectedTeam: null,
};

describe('Import Test', () => {
  test('can import ReportGenerationModal', () => {
    render(<ReportGenerationModal dashboardData={mockDashboardData} onClose={() => {}} />);
    expect(screen.getByText('📊 Generate Support Insights Report')).toBeInTheDocument();
  });
});

