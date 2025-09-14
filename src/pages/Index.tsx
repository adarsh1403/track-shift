import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Train, TrackLayout, OptimizationResult } from '@/types/train';
import { TrainOptimizer } from '@/lib/trainOptimizer';
import TrainInput from '@/components/TrainInput';
import TrackLayoutComponent from '@/components/TrackLayout';
import KPIDashboard from '@/components/KPIDashboard';
import OptimizationResults from '@/components/OptimizationResults';
import GanttChart from '@/components/GanttChart';
import WhatIfSimulation from '@/components/WhatIfSimulation';
import { Settings, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [trains, setTrains] = useState<Train[]>([]);
  const [trackLayout, setTrackLayout] = useState<TrackLayout>({
    hasLoopAtB: true,
    singleTrackAB: true,
    dualTrackBC: true,
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const runOptimization = async () => {
    if (trains.length === 0) {
      toast({
        title: "No trains to optimize",
        description: "Please add at least one train before running optimization.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const optimizer = new TrainOptimizer(trackLayout);
      const result = optimizer.optimizeDispatch(trains);
      setOptimizationResult(result);
      setIsOptimizing(false);
      
      toast({
        title: "Optimization Complete",
        description: `Successfully optimized ${trains.length} trains with ${result.conflictsResolved} conflicts resolved.`,
      });
    }, 1000);
  };

  const handleWhatIfSimulation = (scenario: any) => {
    const optimizer = new TrainOptimizer(trackLayout);
    return optimizer.simulateScenario(trains, scenario);
  };

  const resetOptimization = () => {
    setOptimizationResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-control rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Railway Dispatch Control</h1>
                <p className="text-sm text-muted-foreground">Station A - Train Optimization System</p>
              </div>
            </div>
            <Button 
              onClick={runOptimization}
              disabled={isOptimizing || trains.length === 0}
              className="bg-gradient-control hover:bg-primary-hover shadow-control"
              size="lg"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Dispatch
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrainInput trains={trains} onTrainsChange={setTrains} />
          </div>
          <div>
            <TrackLayoutComponent layout={trackLayout} onLayoutChange={setTrackLayout} />
          </div>
        </div>

        {/* Results Section */}
        {optimizationResult && (
          <>
            {/* KPI Dashboard */}
            <KPIDashboard kpis={optimizationResult.kpis} />

            {/* Optimization Results and Gantt Chart */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <OptimizationResults 
                optimizedTrains={optimizationResult.optimizedTrains}
                conflictsResolved={optimizationResult.conflictsResolved}
              />
              <div className="xl:col-span-1">
                <GanttChart optimizedTrains={optimizationResult.optimizedTrains} />
              </div>
            </div>

            {/* What-If Simulation */}
            <WhatIfSimulation 
              trains={trains}
              onSimulate={handleWhatIfSimulation}
              onReset={resetOptimization}
            />
          </>
        )}

        {/* Welcome/Empty State */}
        {!optimizationResult && trains.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-control rounded-full mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Welcome to Railway Dispatch Control</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add trains waiting at Station A and configure your track layout to begin optimization.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Station A → B (15 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Station B → C (20 min)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Total Journey (35 min)</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
