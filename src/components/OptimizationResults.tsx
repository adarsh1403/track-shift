import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedTrain, TrainPriority } from '@/types/train';
import { Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface OptimizationResultsProps {
  optimizedTrains: OptimizedTrain[];
  conflictsResolved: number;
}

const PRIORITY_COLORS: Record<TrainPriority, string> = {
  critical: 'bg-priority-critical text-white',
  high: 'bg-priority-high text-white',
  medium: 'bg-priority-medium text-white',
  low: 'bg-priority-low text-white',
};

export default function OptimizationResults({ optimizedTrains, conflictsResolved }: OptimizationResultsProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <ArrowRight className="h-5 w-5" />
            Optimized Dispatch Sequence
          </div>
          <Badge variant="outline" className="bg-gradient-status text-success-foreground">
            {conflictsResolved} conflicts resolved
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium text-muted-foreground">Sequence</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Train ID</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Priority</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Scheduled</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Optimized</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Delay</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Destination</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {optimizedTrains.map((train) => (
                <tr key={train.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {train.sequence}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="font-mono font-bold text-primary">{train.id}</div>
                  </td>
                  <td className="p-2">
                    <Badge className={PRIORITY_COLORS[train.priority]}>
                      {train.priority}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div>{formatTime(train.scheduledDeparture)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(train.scheduledDeparture)}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div className="font-semibold">{formatTime(train.optimizedDeparture)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(train.optimizedDeparture)}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      {train.delay === 0 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning" />
                      )}
                      <span className={`text-sm font-medium ${
                        train.delay === 0 ? 'text-success' : 'text-warning'
                      }`}>
                        {train.delay === 0 ? 'On Time' : `+${train.delay}m`}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 text-sm">{train.destination}</td>
                  <td className="p-2">
                    {train.delay === 0 ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success">
                        On Schedule
                      </Badge>
                    ) : train.delay <= 10 ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                        Minor Delay
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                        Delayed
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {optimizedTrains.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No trains to optimize. Add trains to see dispatch sequence.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}