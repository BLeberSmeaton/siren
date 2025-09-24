import { useState, useCallback } from 'react';
import { teamsApi } from '../services/api';
import { TeamConfiguration } from '../types';

export const useTeamManagement = () => {
  const [selectedTeam, setSelectedTeam] = useState<TeamConfiguration | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);

  const handleTeamSelect = useCallback(async (teamName: string | null) => {
    setTeamError(null);
    
    if (!teamName) {
      setSelectedTeam(null);
      return;
    }

    try {
      const teamConfig = await teamsApi.getTeamConfiguration(teamName);
      setSelectedTeam(teamConfig);
    } catch (error) {
      console.error('Failed to load team configuration:', error);
      setSelectedTeam(null);
      setTeamError(`Failed to load team configuration for ${teamName}`);
    }
  }, []);

  return {
    selectedTeam,
    teamError,
    handleTeamSelect,
  };
};
