import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { KPI } from '@/types/train';
import { Clock, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface KPIDashboardProps {
  kpis: KPI;
}

export default function KPIDashboard({ kpis }: KPIDashboardProps) {
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-5 w-5" />
          Performance KPIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Delay */}
          <div className="p-4 bg-gradient-to-br from-background to-muted rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-destructive">
                {kpis.totalDelay}m
              </span>
            </div>
            <div className="text-sm font-medium">Total Delay</div>
            <div className="text-xs text-muted-foreground">System-wide impact</div>
          </div>

          {/* Average Delay */}
          <div className="p-4 bg-gradient-to-br from-background to-muted rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-warning">
                {kpis.averageDelay}m
              </span>
            </div>
            <div className="text-sm font-medium">Avg Delay</div>
            <div className="text-xs text-muted-foreground">Per train impact</div>
          </div>

          {/* On-Time Performance */}
          <div className="p-4 bg-gradient-to-br from-background to-muted rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <span className={`text-2xl font-bold ${getPerformanceColor(kpis.onTimePercentage)}`}>
                {kpis.onTimePercentage}%
              </span>
            </div>
            <div className="text-sm font-medium">On-Time</div>
            <div className="text-xs text-muted-foreground">All trains</div>
            <Progress 
              value={kpis.onTimePercentage} 
              className="mt-2 h-2" 
            />
          </div>

          {/* High Priority On-Time */}
          <div className="p-4 bg-gradient-to-br from-background to-muted rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <span className={`text-2xl font-bold ${getPerformanceColor(kpis.highPriorityOnTime)}`}>
                {kpis.highPriorityOnTime}%
              </span>
            </div>
            <div className="text-sm font-medium">High Priority</div>
            <div className="text-xs text-muted-foreground">Critical & High</div>
            <Progress 
              value={kpis.highPriorityOnTime} 
              className="mt-2 h-2"
            />
          </div>
        </div>

        {/* Track Utilization */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Track Utilization</div>
            <div className="text-sm text-muted-foreground">{kpis.trackUtilization}%</div>
          </div>
          <Progress 
            value={kpis.trackUtilization} 
            className="h-3"
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Underutilized</span>
            <span>Optimal</span>
            <span>Congested</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}