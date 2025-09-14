import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Train, TrainPriority, OptimizationResult } from '@/types/train';
import { Settings, Play, RotateCcw } from 'lucide-react';

interface WhatIfSimulationProps {
  trains: Train[];
  onSimulate: (scenario: any) => OptimizationResult;
  onReset: () => void;
}

export default function WhatIfSimulation({ trains, onSimulate, onReset }: WhatIfSimulationProps) {
  const [scenario, setScenario] = useState({
    delayTrainId: '',
    delayMinutes: 0,
    removeLoop: false,
    changePriority: { trainId: '', newPriority: '' as TrainPriority }
  });
  
  const [simulationResult, setSimulationResult] = useState<OptimizationResult | null>(null);

  const runSimulation = () => {
    const cleanScenario = {
      ...(scenario.delayTrainId && scenario.delayMinutes > 0 && {
        delayTrainId: scenario.delayTrainId,
        delayMinutes: scenario.delayMinutes
      }),
      ...(scenario.removeLoop && { removeLoop: true }),
      ...(scenario.changePriority.trainId && scenario.changePriority.newPriority && {
        changePriority: scenario.changePriority
      })
    };

    const result = onSimulate(cleanScenario);
    setSimulationResult(result);
  };

  const resetSimulation = () => {
    setScenario({
      delayTrainId: '',
      delayMinutes: 0,
      removeLoop: false,
      changePriority: { trainId: '', newPriority: '' as TrainPriority }
    });
    setSimulationResult(null);
    onReset();
  };

  const hasActiveScenarios = 
    (scenario.delayTrainId && scenario.delayMinutes > 0) ||
    scenario.removeLoop ||
    (scenario.changePriority.trainId && scenario.changePriority.newPriority);

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings className="h-5 w-5" />
          What-If Simulation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delay a Train */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm">Delay a Train</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="delay-train">Train to Delay</Label>
                <Select 
                  value={scenario.delayTrainId}
                  onValueChange={(value) => setScenario({ ...scenario, delayTrainId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select train..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.map((train) => (
                      <SelectItem key={train.id} value={train.id}>
                        {train.id} - {train.priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="delay-minutes">Delay (minutes)</Label>
                <Input
                  id="delay-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={scenario.delayMinutes}
                  onChange={(e) => setScenario({ ...scenario, delayMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Change Priority */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm">Change Train Priority</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="priority-train">Train</Label>
                <Select 
                  value={scenario.changePriority.trainId}
                  onValueChange={(value) => setScenario({ 
                    ...scenario, 
                    changePriority: { ...scenario.changePriority, trainId: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select train..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trains.map((train) => (
                      <SelectItem key={train.id} value={train.id}>
                        {train.id} - {train.priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-priority">New Priority</Label>
                <Select 
                  value={scenario.changePriority.newPriority}
                  onValueChange={(value: TrainPriority) => setScenario({ 
                    ...scenario, 
                    changePriority: { ...scenario.changePriority, newPriority: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Track Configuration */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3">Track Configuration Changes</h4>
          <div className="flex items-center space-x-2">
            <Switch
              id="remove-loop"
              checked={scenario.removeLoop}
              onCheckedChange={(checked) => setScenario({ ...scenario, removeLoop: checked })}
            />
            <Label htmlFor="remove-loop" className="text-sm">
              Remove passing loop at Station B
            </Label>
          </div>
        </div>

        {/* Active Scenarios */}
        {hasActiveScenarios && (
          <div className="p-4 bg-gradient-warning/10 rounded-lg border border-warning/20">
            <h4 className="font-semibold text-sm mb-2 text-warning">Active Scenarios</h4>
            <div className="flex flex-wrap gap-2">
              {scenario.delayTrainId && scenario.delayMinutes > 0 && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                  Delay {scenario.delayTrainId} by {scenario.delayMinutes}m
                </Badge>
              )}
              {scenario.removeLoop && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">
                  No loop at Station B
                </Badge>
              )}
              {scenario.changePriority.trainId && scenario.changePriority.newPriority && (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent">
                  {scenario.changePriority.trainId} → {scenario.changePriority.newPriority}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Simulation Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={runSimulation} 
            disabled={!hasActiveScenarios || trains.length === 0}
            className="bg-gradient-control hover:bg-primary-hover"
          >
            <Play className="h-4 w-4 mr-2" />
            Run Simulation
          </Button>
          <Button 
            variant="outline" 
            onClick={resetSimulation}
            disabled={!hasActiveScenarios && !simulationResult}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Simulation Results */}
        {simulationResult && (
          <div className="mt-6 p-4 bg-card rounded-lg border border-primary/20">
            <h4 className="font-semibold text-sm mb-3 text-primary">Simulation Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {simulationResult.kpis.totalDelay}m
                </div>
                <div className="text-xs text-muted-foreground">Total Delay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {simulationResult.kpis.averageDelay}m
                </div>
                <div className="text-xs text-muted-foreground">Avg Delay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {simulationResult.kpis.onTimePercentage}%
                </div>
                <div className="text-xs text-muted-foreground">On-Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {simulationResult.conflictsResolved}
                </div>
                <div className="text-xs text-muted-foreground">Conflicts</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}