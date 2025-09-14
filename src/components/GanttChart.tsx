import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedTrain, TrainPriority } from '@/types/train';
import { BarChart3 } from 'lucide-react';

interface GanttChartProps {
  optimizedTrains: OptimizedTrain[];
}

const PRIORITY_COLORS: Record<TrainPriority, string> = {
  critical: 'bg-priority-critical',
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const TRAVEL_SEGMENTS = {
  AB: 15, // minutes
  BC: 20, // minutes
};

export default function GanttChart({ optimizedTrains }: GanttChartProps) {
  if (optimizedTrains.length === 0) {
    return (
      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            Train Movement Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p>No trains to visualize. Add trains to see movement timeline.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate time range for the chart
  const earliestDeparture = Math.min(
    ...optimizedTrains.map(train => new Date(train.optimizedDeparture).getTime())
  );
  const latestArrival = Math.max(
    ...optimizedTrains.map(train => 
      new Date(train.optimizedDeparture).getTime() + (TRAVEL_SEGMENTS.AB + TRAVEL_SEGMENTS.BC) * 60000
    )
  );

  const timeRange = latestArrival - earliestDeparture;
  const chartWidth = 800; // Fixed width for the timeline

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPosition = (timestamp: number) => {
    return ((timestamp - earliestDeparture) / timeRange) * chartWidth;
  };

  const getWidth = (duration: number) => {
    return (duration * 60000 / timeRange) * chartWidth;
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BarChart3 className="h-5 w-5" />
          Train Movement Timeline (Gantt Chart)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="relative" style={{ width: chartWidth + 100, minHeight: optimizedTrains.length * 80 + 100 }}>
            {/* Time axis */}
            <div className="absolute top-0 left-12 right-0 h-8 border-b border-border">
              {Array.from({ length: 7 }, (_, i) => {
                const time = earliestDeparture + (timeRange * i) / 6;
                return (
                  <div
                    key={i}
                    className="absolute top-0 text-xs text-muted-foreground"
                    style={{ left: (chartWidth * i) / 6 }}
                  >
                    <div className="w-px h-4 bg-border mb-1"></div>
                    {formatTime(time)}
                  </div>
                );
              })}
            </div>

            {/* Station markers */}
            <div className="absolute left-12 top-8 right-0">
              <div className="relative h-6 mb-4">
                <div className="absolute left-0 top-2 w-2 h-2 bg-primary rounded-full"></div>
                <div className="absolute left-4 top-0 text-xs font-medium text-primary">Station A</div>
                
                <div className="absolute left-1/3 top-2 w-2 h-2 bg-accent rounded-full"></div>
                <div className="absolute left-1/3 ml-4 top-0 text-xs font-medium text-accent">Station B</div>
                
                <div className="absolute right-0 top-2 w-2 h-2 bg-success rounded-full"></div>
                <div className="absolute right-0 mr-4 top-0 text-xs font-medium text-success">Station C</div>
              </div>
            </div>

            {/* Train timelines */}
            {optimizedTrains.map((train, index) => {
              const departureTime = new Date(train.optimizedDeparture).getTime();
              const arrivalAtB = departureTime + TRAVEL_SEGMENTS.AB * 60000;
              const arrivalAtC = arrivalAtB + TRAVEL_SEGMENTS.BC * 60000;

              const departurePos = getPosition(departureTime);
              const segmentABWidth = getWidth(TRAVEL_SEGMENTS.AB);
              const segmentBCWidth = getWidth(TRAVEL_SEGMENTS.BC);

              return (
                <div
                  key={train.id}
                  className="absolute left-0 flex items-center"
                  style={{ top: 80 + index * 60 }}
                >
                  {/* Train ID */}
                  <div className="w-12 text-xs font-mono font-bold text-right pr-2">
                    {train.id}
                  </div>

                  {/* A→B Segment */}
                  <div
                    className={`h-6 ${PRIORITY_COLORS[train.priority]} rounded-l-md flex items-center justify-center text-white text-xs font-semibold shadow-sm`}
                    style={{
                      left: departurePos,
                      width: segmentABWidth,
                      position: 'absolute'
                    }}
                  >
                    A→B
                  </div>

                  {/* B→C Segment */}
                  <div
                    className={`h-6 ${PRIORITY_COLORS[train.priority]} rounded-r-md flex items-center justify-center text-white text-xs font-semibold shadow-sm opacity-80`}
                    style={{
                      left: departurePos + segmentABWidth,
                      width: segmentBCWidth,
                      position: 'absolute'
                    }}
                  >
                    B→C
                  </div>

                  {/* Delay indicator */}
                  {train.delay > 0 && (
                    <div
                      className="absolute -top-2 -right-1 bg-warning text-warning-foreground text-xs px-1 rounded"
                      style={{ left: departurePos + segmentABWidth + segmentBCWidth }}
                    >
                      +{train.delay}m
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          {Object.entries(PRIORITY_COLORS).map(([priority, colorClass]) => (
            <div key={priority} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${colorClass} rounded`}></div>
              <span className="text-sm capitalize">{priority} Priority</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}