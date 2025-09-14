export type TrainPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Train {
  id: string;
  priority: TrainPriority;
  scheduledDeparture: string; // ISO time string
  destination: string;
  estimatedTravelTime?: number; // minutes
}

export interface OptimizedTrain extends Train {
  optimizedDeparture: string;
  delay: number; // minutes
  sequence: number;
}

export interface TrackLayout {
  hasLoopAtB: boolean;
  singleTrackAB: boolean;
  dualTrackBC: boolean;
}

export interface KPI {
  totalDelay: number;
  averageDelay: number;
  onTimePercentage: number;
  highPriorityOnTime: number;
  trackUtilization: number;
}

export interface OptimizationResult {
  optimizedTrains: OptimizedTrain[];
  kpis: KPI;
  conflictsResolved: number;
}