import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Train, TrainPriority } from '@/types/train';

interface TrainInputProps {
  trains: Train[];
  onTrainsChange: (trains: Train[]) => void;
}

const DESTINATIONS = ['Station C', 'Station D', 'Station E', 'Depot'];
const PRIORITIES: { value: TrainPriority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-priority-critical' },
  { value: 'high', label: 'High', color: 'text-priority-high' },
  { value: 'medium', label: 'Medium', color: 'text-priority-medium' },
  { value: 'low', label: 'Low', color: 'text-priority-low' },
];

export default function TrainInput({ trains, onTrainsChange }: TrainInputProps) {
  const [newTrain, setNewTrain] = useState<Partial<Train>>({
    id: '',
    priority: 'medium',
    scheduledDeparture: '',
    destination: '',
  });

  const addTrain = () => {
    if (newTrain.id && newTrain.scheduledDeparture && newTrain.destination) {
      const train: Train = {
        id: newTrain.id,
        priority: newTrain.priority as TrainPriority,
        scheduledDeparture: newTrain.scheduledDeparture,
        destination: newTrain.destination,
      };
      
      onTrainsChange([...trains, train]);
      setNewTrain({
        id: '',
        priority: 'medium',
        scheduledDeparture: '',
        destination: '',
      });
    }
  };

  const removeTrain = (trainId: string) => {
    onTrainsChange(trains.filter(train => train.id !== trainId));
  };

  const getPriorityColor = (priority: TrainPriority) => {
    return PRIORITIES.find(p => p.value === priority)?.color || 'text-foreground';
  };

  return (
    <Card className="shadow-control">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="w-3 h-3 rounded-full bg-gradient-control"></div>
          Train Input Panel - Station A
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Train Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="trainId">Train ID</Label>
            <Input
              id="trainId"
              placeholder="T001"
              value={newTrain.id}
              onChange={(e) => setNewTrain({ ...newTrain, id: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={newTrain.priority} 
              onValueChange={(value: TrainPriority) => 
                setNewTrain({ ...newTrain, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="departure">Scheduled Departure</Label>
            <Input
              id="departure"
              type="datetime-local"
              value={newTrain.scheduledDeparture}
              onChange={(e) => setNewTrain({ ...newTrain, scheduledDeparture: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Select 
              value={newTrain.destination} 
              onValueChange={(value) => setNewTrain({ ...newTrain, destination: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map((dest) => (
                  <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={addTrain} className="w-full bg-gradient-control hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Train
            </Button>
          </div>
        </div>

        {/* Current Trains List */}
        {trains.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Trains Waiting at Station A</h3>
            <div className="grid gap-3">
              {trains.map((train) => (
                <div 
                  key={train.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono font-bold text-primary">{train.id}</div>
                    <div className={`font-semibold ${getPriorityColor(train.priority)}`}>
                      {PRIORITIES.find(p => p.value === train.priority)?.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(train.scheduledDeparture).toLocaleString()}
                    </div>
                    <div className="text-sm">{train.destination}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeTrain(train.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}