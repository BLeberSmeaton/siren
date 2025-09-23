// TypeScript definitions matching the SIREN.Core models

export interface SupportSignal {
  id: string;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  category?: string;
  manualScore?: number;
}

export interface SignalSummary {
  totalSignals: number;
  categorizedSignals: number;
  uncategorizedSignals: number;
  manuallyScored: number;
  categories: CategoryCount[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  manuallyScored: number;
  averageManualScore: number;
  latestSignal: string;
}

export interface ManualScoreRequest {
  score: number;
}

export interface CategorizeRequest {
  category?: string;
  useAutoCategorization: boolean;
}

// UI state types
export interface DashboardState {
  signals: SupportSignal[];
  summary: SignalSummary | null;
  categoryStats: CategoryStats[];
  teams: TeamSummary[];
  selectedTeam: TeamConfiguration | null;
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
}

export interface TriageState {
  selectedSignal: SupportSignal | null;
  isTriaging: boolean;
  manualScore: number;
  manualCategory: string;
  triageNotes: string;
}

// Team configuration types
export interface TeamSummary {
  teamName: string;
  displayName: string;
  description?: string;
  activeCategoriesCount: number;
  enabledDataSourcesCount: number;
  updatedAt: string;
}

export interface TeamConfiguration {
  teamName: string;
  displayName: string;
  description?: string;
  dataSources: DataSourceConfiguration[];
  categories: CategoryConfiguration[];
  triageSettings: TriageConfiguration;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceConfiguration {
  sourceType: string;
  name: string;
  isEnabled: boolean;
  settings: { [key: string]: string };
  applicableCategories: string[];
}

export interface CategoryConfiguration {
  name: string;
  displayName: string;
  description?: string;
  keywords: string[];
  priority: number;
  color?: string;
  isActive: boolean;
}

export interface TriageConfiguration {
  enableManualScoring: boolean;
  defaultScore: number;
  highPriorityCategories: string[];
  categoryDefaultScores: { [key: string]: number };
}

// Report generation types
export type ReportPeriod = 'week' | 'fortnight' | 'month' | 'quarter' | 'all-time' | 'custom';
export type ReportFormat = 'pdf' | 'csv';

export interface ReportConfiguration {
  period: ReportPeriod;
  format: ReportFormat;
  startDate: Date;
  endDate: Date;
  includeTeamData: boolean;
  selectedTeam?: string;
  customStartDate?: Date;
  customEndDate?: Date;
  includeCategories: string[];
  minimumScore?: number;
}

export interface ReportData {
  signals: SupportSignal[];
  summary: SignalSummary | null;
  categoryStats: CategoryStats[];
  teams: TeamSummary[];
  selectedTeam: TeamConfiguration | null;
  reportConfig: ReportConfiguration;
  generatedAt: Date;
}

export interface ReportMetrics {
  totalSignals: number;
  signalsByCategory: { [category: string]: number };
  averageScore: number;
  highPriorityCount: number;
  trendsFromPreviousPeriod: {
    signalChange: number;
    scoreChange: number;
    categoryChanges: { [category: string]: number };
  };
  topCategories: { category: string; count: number; change: number }[];
  criticalSignals: SupportSignal[];
}