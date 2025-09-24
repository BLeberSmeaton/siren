import { renderHook, act, waitFor } from '@testing-library/react';
import { useTeamManagement } from '../useTeamManagement';
import { teamsApi } from '../../services/api';

// Mock the API module
jest.mock('../../services/api', () => ({
  teamsApi: {
    getTeamConfiguration: jest.fn(),
  },
}));

const mockTeamConfig = {
  teamName: 'team-bolt',
  displayName: 'Team Bolt',
  description: 'Support team for AccountRight Live and API services',
  categories: [
    {
      name: 'api',
      displayName: 'API Issues',
      description: 'API-related problems',
      keywords: ['api', 'endpoint', 'request'],
      priority: 1,
      color: '#ff6b6b',
      isActive: true,
    },
  ],
  dataSources: [
    {
      sourceType: 'Jira',
      name: 'AR Live Jira',
      isEnabled: true,
      settings: {},
      applicableCategories: ['api'],
    },
  ],
  triageSettings: {
    enableManualScoring: true,
    defaultScore: 5,
    highPriorityCategories: ['api'],
    categoryDefaultScores: {},
  },
  createdAt: '2023-09-22T10:00:00Z',
  updatedAt: '2023-09-22T10:00:00Z',
};

describe('useTeamManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (teamsApi.getTeamConfiguration as jest.Mock).mockResolvedValue(mockTeamConfig);
  });

  test('initial state is correct', () => {
    const { result } = renderHook(() => useTeamManagement());

    expect(result.current.selectedTeam).toBeNull();
    expect(result.current.teamError).toBeNull();
  });

  test('handleTeamSelect loads team configuration successfully', async () => {
    const { result } = renderHook(() => useTeamManagement());

    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.selectedTeam).toEqual(mockTeamConfig);
    expect(result.current.teamError).toBeNull();
    expect(teamsApi.getTeamConfiguration).toHaveBeenCalledWith('team-bolt');
  });

  test('handleTeamSelect with null clears selected team', async () => {
    const { result } = renderHook(() => useTeamManagement());

    // First select a team
    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.selectedTeam).toEqual(mockTeamConfig);

    // Then clear selection
    await act(async () => {
      await result.current.handleTeamSelect(null);
    });

    expect(result.current.selectedTeam).toBeNull();
    expect(result.current.teamError).toBeNull();
  });

  test('handleTeamSelect with empty string clears selected team', async () => {
    const { result } = renderHook(() => useTeamManagement());

    // First select a team
    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.selectedTeam).toEqual(mockTeamConfig);

    // Then clear selection with empty string
    await act(async () => {
      await result.current.handleTeamSelect('');
    });

    expect(result.current.selectedTeam).toBeNull();
    expect(result.current.teamError).toBeNull();
  });

  test('handleTeamSelect handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch team configuration';
    (teamsApi.getTeamConfiguration as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTeamManagement());

    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.selectedTeam).toBeNull();
    expect(result.current.teamError).toBe('Failed to load team configuration for team-bolt');
  });

  test('teamError is cleared when selecting a new team', async () => {
    const { result } = renderHook(() => useTeamManagement());

    // First cause an error
    (teamsApi.getTeamConfiguration as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.teamError).toBe('Failed to load team configuration for team-bolt');

    // Now fix the API and try again
    (teamsApi.getTeamConfiguration as jest.Mock).mockResolvedValue(mockTeamConfig);

    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.selectedTeam).toEqual(mockTeamConfig);
    expect(result.current.teamError).toBeNull();
  });

  test('teamError is cleared when clearing team selection', async () => {
    const { result } = renderHook(() => useTeamManagement());

    // First cause an error
    (teamsApi.getTeamConfiguration as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await result.current.handleTeamSelect('team-bolt');
    });

    expect(result.current.teamError).toBe('Failed to load team configuration for team-bolt');

    // Now clear selection
    await act(async () => {
      await result.current.handleTeamSelect(null);
    });

    expect(result.current.selectedTeam).toBeNull();
    expect(result.current.teamError).toBeNull();
  });
});
