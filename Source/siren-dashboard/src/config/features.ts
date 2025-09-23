// Feature toggles for SIREN Dashboard
// Control which features are enabled/disabled in the application

interface FeatureConfig {
  enableTeamsFeature: boolean;
  enableAdvancedFiltering: boolean;
  enableRealtimeUpdates: boolean;
}

// Feature flags - set to false to disable features
export const FEATURE_FLAGS: FeatureConfig = {
  // Team selection and team context functionality
  // Set to false until teams are properly integrated and ready for production
  enableTeamsFeature: false,
  
  // Advanced filtering capabilities (future feature)
  enableAdvancedFiltering: true,
  
  // Real-time updates for signals (future feature)
  enableRealtimeUpdates: false,
};

// Helper functions for checking feature flags
export const isTeamsFeatureEnabled = (): boolean => {
  return FEATURE_FLAGS.enableTeamsFeature;
};

export const isAdvancedFilteringEnabled = (): boolean => {
  return FEATURE_FLAGS.enableAdvancedFiltering;
};

export const isRealtimeUpdatesEnabled = (): boolean => {
  return FEATURE_FLAGS.enableRealtimeUpdates;
};
