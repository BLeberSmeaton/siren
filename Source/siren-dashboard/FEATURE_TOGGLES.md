# Feature Toggles Documentation

This document outlines the feature toggle system implemented in the SIREN Dashboard.

## Overview

Feature toggles allow us to control which features are enabled or disabled in the application without requiring code changes. This enables safer deployments and gradual feature rollouts.

## Current Feature Toggles

### Teams Feature (`enableTeamsFeature`)

**Status:** 🔴 **DISABLED** (not ready for production)

**Location:** `src/config/features.ts`

**What it controls:**
- Team selection dropdown in the dashboard header
- Team context section showing team details, categories, data sources, and triage settings
- API calls to `/api/teams` endpoints

**Why it's disabled:**
- Teams are not properly integrated with the core system yet
- Team configurations exist but are not connected to signal processing
- Requires additional backend integration work

**To enable:** Change `enableTeamsFeature: false` to `enableTeamsFeature: true` in `src/config/features.ts`

### Advanced Filtering (`enableAdvancedFiltering`)

**Status:** 🟢 **ENABLED**

**What it controls:** Future advanced filtering capabilities (placeholder)

### Real-time Updates (`enableRealtimeUpdates`)

**Status:** 🔴 **DISABLED**

**What it controls:** Real-time signal updates (placeholder for future feature)

## How to Use Feature Toggles

### For Developers

1. **Check if a feature is enabled:**
   ```typescript
   import { isTeamsFeatureEnabled } from '../config/features';
   
   if (isTeamsFeatureEnabled()) {
     // Feature code here
   }
   ```

2. **Conditional rendering:**
   ```tsx
   {isTeamsFeatureEnabled() && (
     <div className="team-selector">
       {/* Team selection UI */}
     </div>
   )}
   ```

3. **Conditional API calls:**
   ```typescript
   const teams = isTeamsFeatureEnabled() 
     ? await teamsApi.getTeams(forceRefresh)
     : [];
   ```

### For Testing

Feature toggles are mocked in tests to ensure consistent behavior:

```typescript
// Mock the feature flags in test files
jest.mock('../config/features', () => ({
  isTeamsFeatureEnabled: jest.fn(() => false), // Disabled by default
  isAdvancedFilteringEnabled: jest.fn(() => true),
  isRealtimeUpdatesEnabled: jest.fn(() => false),
}));
```

## Implementation Details

### Files Modified for Teams Feature Toggle:
- `src/config/features.ts` - Feature toggle configuration
- `src/pages/Dashboard.tsx` - Conditional rendering and API calls
- `src/__tests__/Dashboard.test.tsx` - Mock setup for tests
- `src/App.test.tsx` - Mock setup for tests
- `src/__tests__/api.test.ts` - API test coverage

### Key Benefits:
1. **Safe Deployment:** Features can be developed and deployed but kept hidden until ready
2. **Gradual Rollout:** Features can be enabled for specific environments or user groups
3. **Quick Rollback:** Features can be disabled instantly without code changes
4. **A/B Testing:** Different features can be enabled for different user segments

## Next Steps for Teams Feature

To fully enable the teams feature:

1. ✅ **API Endpoints** - Teams controller is implemented
2. ✅ **UI Components** - Team selection and context display is complete
3. ✅ **Feature Toggle** - Toggle system is in place
4. ❌ **Backend Integration** - Connect teams to signal processing pipeline
5. ❌ **Data Migration** - Ensure team configurations are properly populated
6. ❌ **Testing** - End-to-end testing with real team data
7. ❌ **Documentation** - User-facing documentation for teams feature

## Production Deployment

**Current Status:** The teams feature is safely hidden behind a feature toggle and won't appear in production until explicitly enabled.

**To enable in production:** Update `enableTeamsFeature: true` in the production deployment configuration.
