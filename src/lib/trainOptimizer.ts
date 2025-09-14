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

interface TrackOccupancy {
  trackAB: { departureTime: Date; arrivalTimeB: Date; trainId: string }[];
  stationB: { arrivalTime: Date; departureTimeB: Date; trainId: string; priority: TrainPriority }[];
  trackBC1: { departureTimeB: Date; arrivalTimeC: Date; trainId: string }[];
  trackBC2: { departureTimeB: Date; arrivalTimeC: Date; trainId: string }[];
}

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

    const trackOccupancy: TrackOccupancy = {
      trackAB: [],
      stationB: [],
      trackBC1: [],
      trackBC2: [],
    };

    const optimizedTrains: OptimizedTrain[] = [];
    let conflictsResolved = 0;

    for (let i = 0; i < sortedTrains.length; i++) {
      const train = sortedTrains[i];
      const scheduledTime = new Date(train.scheduledDeparture);
      
      // Find the earliest available departure time from Station A
      const { departureTime, delay, conflicts } = this.findOptimalDepartureTime(
        train, 
        scheduledTime, 
        trackOccupancy
      );

      conflictsResolved += conflicts;

      // Reserve track segments for this train
      this.reserveTrackSegments(train, departureTime, trackOccupancy);
      
      optimizedTrains.push({
        ...train,
        optimizedDeparture: departureTime.toISOString(),
        delay,
        sequence: i + 1,
      });
    }

    // Sort optimized trains by actual departure time for proper sequencing
    optimizedTrains.sort((a, b) => 
      new Date(a.optimizedDeparture).getTime() - new Date(b.optimizedDeparture).getTime()
    );
    
    // Update sequence numbers
    optimizedTrains.forEach((train, index) => {
      train.sequence = index + 1;
    });

    const kpis = this.calculateKPIs(trains, optimizedTrains);

    return {
      optimizedTrains,
      kpis,
      conflictsResolved,
    };
  }

  private findOptimalDepartureTime(
    train: Train, 
    scheduledTime: Date, 
    trackOccupancy: TrackOccupancy
  ): { departureTime: Date; delay: number; conflicts: number } {
    let proposedTime = scheduledTime;
    let conflicts = 0;
    
    while (true) {
      // Check if A→B track is available
      const canDepartA = this.isTrackABAvailable(proposedTime, trackOccupancy);
      
      if (canDepartA) {
        // Calculate when train arrives at B
        const arrivalB = new Date(proposedTime.getTime() + TRAVEL_TIMES.AB * 60000);
        
        // Check if we can get through Station B and onto B→C tracks efficiently
        const canProceedFromB = this.canProceedFromStationB(
          train, 
          arrivalB, 
          trackOccupancy
        );
        
        if (canProceedFromB) {
          break;
        }
      }
      
      // Try next available slot (increment by 1 minute for finer optimization)
      proposedTime = new Date(proposedTime.getTime() + 1 * 60000);
      if (proposedTime.getTime() > scheduledTime.getTime()) {
        conflicts++;
      }
    }
    
    const delay = Math.max(0, (proposedTime.getTime() - scheduledTime.getTime()) / (1000 * 60));
    
    return {
      departureTime: proposedTime,
      delay,
      conflicts: Math.min(conflicts, 1), // Count as max 1 conflict per train
    };
  }

  private isTrackABAvailable(proposedTime: Date, trackOccupancy: TrackOccupancy): boolean {
    const arrivalAtB = new Date(proposedTime.getTime() + TRAVEL_TIMES.AB * 60000);
    
    // Check if any train is currently using the A→B track
    return !trackOccupancy.trackAB.some(occupation => {
      return (
        proposedTime >= occupation.departureTime && 
        proposedTime < occupation.arrivalTimeB
      ) || (
        arrivalAtB > occupation.departureTime && 
        arrivalAtB <= occupation.arrivalTimeB
      );
    });
  }

  private canProceedFromStationB(
    train: Train, 
    arrivalB: Date, 
    trackOccupancy: TrackOccupancy
  ): boolean {
    // Minimum time at station B (for safety and operations)
    const minStationTime = 2; // minutes
    const departureB = new Date(arrivalB.getTime() + minStationTime * 60000);
    
    // If we have a loop at B, check for priority-based overtaking
    if (this.trackLayout.hasLoopAtB) {
      const departureTimeFromB = this.findOptimalDepartureBTime(
        train, 
        departureB, 
        trackOccupancy
      );
      
      return departureTimeFromB !== null;
    }
    
    // Without loop, use FIFO but still check track availability
    return this.isBCTrackAvailable(departureB, trackOccupancy);
  }

  private findOptimalDepartureBTime(
    train: Train, 
    earliestDepartureB: Date, 
    trackOccupancy: TrackOccupancy
  ): Date | null {
    let proposedDepartureB = earliestDepartureB;
    
    // Try to find a slot within reasonable time (max 30 min delay at B)
    const maxWaitTime = 30 * 60000; // 30 minutes
    const endTime = new Date(earliestDepartureB.getTime() + maxWaitTime);
    
    while (proposedDepartureB <= endTime) {
      // Check if a B→C track is available
      if (this.isBCTrackAvailable(proposedDepartureB, trackOccupancy)) {
        // If we have a loop, allow higher priority trains to overtake
        if (this.canOvertakeAtB(train, proposedDepartureB, trackOccupancy)) {
          return proposedDepartureB;
        }
      }
      
      // Try 1 minute later
      proposedDepartureB = new Date(proposedDepartureB.getTime() + 1 * 60000);
    }
    
    return proposedDepartureB; // Return last attempt even if not optimal
  }

  private isBCTrackAvailable(departureB: Date, trackOccupancy: TrackOccupancy): boolean {
    const arrivalC = new Date(departureB.getTime() + TRAVEL_TIMES.BC * 60000);
    
    // Check if either B→C track is available (dual track system)
    const track1Available = !trackOccupancy.trackBC1.some(occupation => {
      return (
        departureB >= occupation.departureTimeB && 
        departureB < occupation.arrivalTimeC
      ) || (
        arrivalC > occupation.departureTimeB && 
        arrivalC <= occupation.arrivalTimeC
      );
    });
    
    const track2Available = !trackOccupancy.trackBC2.some(occupation => {
      return (
        departureB >= occupation.departureTimeB && 
        departureB < occupation.arrivalTimeC
      ) || (
        arrivalC > occupation.departureTimeB && 
        arrivalC <= occupation.arrivalTimeC
      );
    });
    
    return track1Available || track2Available;
  }

  private canOvertakeAtB(
    train: Train, 
    proposedDepartureB: Date, 
    trackOccupancy: TrackOccupancy
  ): boolean {
    if (!this.trackLayout.hasLoopAtB) return true;
    
    // Check if any lower priority trains are waiting that should be overtaken
    const trainsAtB = trackOccupancy.stationB.filter(occupation => 
      occupation.departureTimeB > proposedDepartureB
    );
    
    // Higher priority trains can overtake lower priority ones
    return !trainsAtB.some(waitingTrain => 
      PRIORITY_WEIGHTS[waitingTrain.priority] > PRIORITY_WEIGHTS[train.priority] &&
      waitingTrain.departureTimeB <= proposedDepartureB
    );
  }

  private reserveTrackSegments(
    train: Train, 
    departureA: Date, 
    trackOccupancy: TrackOccupancy
  ): void {
    const arrivalB = new Date(departureA.getTime() + TRAVEL_TIMES.AB * 60000);
    const departureB = this.findOptimalDepartureBTime(train, arrivalB, trackOccupancy) || 
                      new Date(arrivalB.getTime() + 2 * 60000); // Fallback: 2 min at station
    const arrivalC = new Date(departureB.getTime() + TRAVEL_TIMES.BC * 60000);
    
    // Reserve A→B track
    trackOccupancy.trackAB.push({
      departureTime: departureA,
      arrivalTimeB: arrivalB,
      trainId: train.id,
    });
    
    // Reserve station B
    trackOccupancy.stationB.push({
      arrivalTime: arrivalB,
      departureTimeB: departureB,
      trainId: train.id,
      priority: train.priority,
    });
    
    // Reserve B→C track (choose the available one)
    const track1Available = !trackOccupancy.trackBC1.some(occupation => {
      return (
        departureB >= occupation.departureTimeB && 
        departureB < occupation.arrivalTimeC
      );
    });
    
    if (track1Available) {
      trackOccupancy.trackBC1.push({
        departureTimeB: departureB,
        arrivalTimeC: arrivalC,
        trainId: train.id,
      });
    } else {
      trackOccupancy.trackBC2.push({
        departureTimeB: departureB,
        arrivalTimeC: arrivalC,
        trainId: train.id,
      });
    }
  }

  private calculateKPIs(originalTrains: Train[], optimizedTrains: OptimizedTrain[]): KPI {
    const totalDelay = optimizedTrains.reduce((sum, train) => sum + train.delay, 0);
    const averageDelay = optimizedTrains.length > 0 ? totalDelay / optimizedTrains.length : 0;
    
    const onTimeTrains = optimizedTrains.filter(train => train.delay === 0).length;
    const onTimePercentage = optimizedTrains.length > 0 ? (onTimeTrains / optimizedTrains.length) * 100 : 0;
    
    const highPriorityTrains = optimizedTrains.filter(train => 
      train.priority === 'critical' || train.priority === 'high'
    );
    const highPriorityOnTime = highPriorityTrains.filter(train => train.delay === 0).length;
    const highPriorityOnTimePerc = highPriorityTrains.length > 0 
      ? (highPriorityOnTime / highPriorityTrains.length) * 100 
      : 100;

    // Improved track utilization calculation based on actual dispatch intervals
    let trackUtilization = 0;
    if (optimizedTrains.length > 1) {
      const sortedByDeparture = [...optimizedTrains].sort((a, b) => 
        new Date(a.optimizedDeparture).getTime() - new Date(b.optimizedDeparture).getTime()
      );
      
      let totalIntervals = 0;
      let actualIntervals = 0;
      
      for (let i = 1; i < sortedByDeparture.length; i++) {
        const prev = new Date(sortedByDeparture[i - 1].optimizedDeparture);
        const current = new Date(sortedByDeparture[i].optimizedDeparture);
        const interval = (current.getTime() - prev.getTime()) / (1000 * 60); // minutes
        
        actualIntervals += interval;
        totalIntervals += TRAVEL_TIMES.AB; // Theoretical minimum for single track A→B
      }
      
      // Calculate efficiency: how close we are to theoretical maximum throughput
      trackUtilization = totalIntervals > 0 ? (totalIntervals / actualIntervals) * 100 : 0;
      trackUtilization = Math.min(95, Math.max(0, trackUtilization)); // Cap at 95% for safety
    } else {
      trackUtilization = optimizedTrains.length > 0 ? 25 : 0; // Single train utilization
    }

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