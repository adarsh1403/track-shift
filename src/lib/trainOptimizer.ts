import { Train, OptimizedTrain, TrackLayout, KPI, OptimizationResult, TrainPriority } from '@/types/train';

const PRIORITY_WEIGHTS: Record<TrainPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const TRAVEL_TIMES = {
  AB: 15, // minutes
  BC: 20, // minutes
  total: 35, // A to C
};

export class TrainOptimizer {
  private trackLayout: TrackLayout;

  constructor(trackLayout: TrackLayout) {
    this.trackLayout = trackLayout;
  }

  optimizeDispatch(trains: Train[]): OptimizationResult {
    // Sort trains by priority first, then by scheduled departure
    const sortedTrains = [...trains].sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.scheduledDeparture).getTime() - new Date(b.scheduledDeparture).getTime();
    });

    const optimizedTrains: OptimizedTrain[] = [];
    const departureSlots: Date[] = [];
    let conflictsResolved = 0;

    for (let i = 0; i < sortedTrains.length; i++) {
      const train = sortedTrains[i];
      const scheduledTime = new Date(train.scheduledDeparture);
      
      // Find the earliest available slot considering conflicts
      let proposedTime = scheduledTime;
      let hasConflict = true;
      let delay = 0;

      while (hasConflict) {
        hasConflict = this.checkConflict(proposedTime, departureSlots, train.priority);
        
        if (hasConflict) {
          proposedTime = new Date(proposedTime.getTime() + 5 * 60000); // Add 5 minutes
          delay += 5;
          conflictsResolved++;
        }
      }

      departureSlots.push(proposedTime);
      
      optimizedTrains.push({
        ...train,
        optimizedDeparture: proposedTime.toISOString(),
        delay,
        sequence: i + 1,
      });
    }

    const kpis = this.calculateKPIs(trains, optimizedTrains);

    return {
      optimizedTrains,
      kpis,
      conflictsResolved,
    };
  }

  private checkConflict(proposedTime: Date, existingSlots: Date[], priority: TrainPriority): boolean {
    const minInterval = this.trackLayout.hasLoopAtB ? 10 : 20; // minutes between trains
    
    return existingSlots.some(slot => {
      const timeDiff = Math.abs(proposedTime.getTime() - slot.getTime()) / (1000 * 60);
      return timeDiff < minInterval;
    });
  }

  private calculateKPIs(originalTrains: Train[], optimizedTrains: OptimizedTrain[]): KPI {
    const totalDelay = optimizedTrains.reduce((sum, train) => sum + train.delay, 0);
    const averageDelay = totalDelay / optimizedTrains.length;
    
    const onTimeTrains = optimizedTrains.filter(train => train.delay === 0).length;
    const onTimePercentage = (onTimeTrains / optimizedTrains.length) * 100;
    
    const highPriorityTrains = optimizedTrains.filter(train => 
      train.priority === 'critical' || train.priority === 'high'
    );
    const highPriorityOnTime = highPriorityTrains.filter(train => train.delay === 0).length;
    const highPriorityOnTimePerc = highPriorityTrains.length > 0 
      ? (highPriorityOnTime / highPriorityTrains.length) * 100 
      : 100;

    // Simple track utilization calculation
    const trackUtilization = Math.min(95, (optimizedTrains.length / 12) * 100); // Assume 12 trains max per hour

    return {
      totalDelay,
      averageDelay: Math.round(averageDelay * 100) / 100,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      highPriorityOnTime: Math.round(highPriorityOnTimePerc * 100) / 100,
      trackUtilization: Math.round(trackUtilization * 100) / 100,
    };
  }

  simulateScenario(trains: Train[], scenario: {
    delayTrainId?: string;
    delayMinutes?: number;
    removeLoop?: boolean;
    changePriority?: { trainId: string; newPriority: TrainPriority };
  }): OptimizationResult {
    let modifiedTrains = [...trains];
    let modifiedLayout = { ...this.trackLayout };

    // Apply scenario modifications
    if (scenario.delayTrainId && scenario.delayMinutes) {
      modifiedTrains = modifiedTrains.map(train => {
        if (train.id === scenario.delayTrainId) {
          const newTime = new Date(train.scheduledDeparture);
          newTime.setMinutes(newTime.getMinutes() + scenario.delayMinutes!);
          return { ...train, scheduledDeparture: newTime.toISOString() };
        }
        return train;
      });
    }

    if (scenario.removeLoop) {
      modifiedLayout.hasLoopAtB = false;
    }

    if (scenario.changePriority) {
      modifiedTrains = modifiedTrains.map(train => 
        train.id === scenario.changePriority!.trainId 
          ? { ...train, priority: scenario.changePriority!.newPriority }
          : train
      );
    }

    const tempOptimizer = new TrainOptimizer(modifiedLayout);
    return tempOptimizer.optimizeDispatch(modifiedTrains);
  }
}