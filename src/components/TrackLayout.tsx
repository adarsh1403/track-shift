import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrackLayout as TrackLayoutType } from '@/types/train';

interface TrackLayoutProps {
  layout: TrackLayoutType;
  onLayoutChange: (layout: TrackLayoutType) => void;
}

export default function TrackLayout({ layout, onLayoutChange }: TrackLayoutProps) {
  return (
    <Card className="shadow-control">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <div className="w-3 h-3 rounded-full bg-gradient-status"></div>
          Track Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Track Schematic */}
        <div className="bg-muted p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mb-2">
                A
              </div>
              <div className="text-sm font-medium">Station A</div>
              <div className="text-xs text-muted-foreground">Control Point</div>
            </div>

            <div className="flex-1 px-4">
              <div className="relative">
                <div className="h-2 bg-border rounded"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  {layout.singleTrackAB ? 'Single Track' : 'Dual Track'}
                </div>
              </div>
            </div>

            <div className="text-center relative">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold mb-2">
                B
              </div>
              <div className="text-sm font-medium">Station B</div>
              <div className="text-xs text-muted-foreground">
                {layout.hasLoopAtB ? 'With Loop' : 'No Loop'}
              </div>
              
              {/* Loop visualization */}
              {layout.hasLoopAtB && (
                <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-accent rounded-full"></div>
              )}
            </div>

            <div className="flex-1 px-4">
              <div className="relative">
                <div className="h-2 bg-border rounded mb-1"></div>
                <div className="h-2 bg-border rounded"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  Dual Track
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-success-foreground font-bold mb-2">
                C
              </div>
              <div className="text-sm font-medium">Station C</div>
              <div className="text-xs text-muted-foreground">Terminal</div>
            </div>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="loop-at-b"
              checked={layout.hasLoopAtB}
              onCheckedChange={(checked) =>
                onLayoutChange({ ...layout, hasLoopAtB: checked })
              }
            />
            <Label htmlFor="loop-at-b" className="text-sm">
              Passing Loop at Station B
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="single-track-ab"
              checked={layout.singleTrackAB}
              onCheckedChange={(checked) =>
                onLayoutChange({ ...layout, singleTrackAB: checked })
              }
            />
            <Label htmlFor="single-track-ab" className="text-sm">
              Single Track A→B
            </Label>
          </div>
        </div>

        {/* Track Information */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-card rounded border">
            <div className="text-2xl font-bold text-primary">15</div>
            <div className="text-xs text-muted-foreground">min A→B</div>
          </div>
          <div className="p-3 bg-card rounded border">
            <div className="text-2xl font-bold text-accent">20</div>
            <div className="text-xs text-muted-foreground">min B→C</div>
          </div>
          <div className="p-3 bg-card rounded border">
            <div className="text-2xl font-bold text-success">35</div>
            <div className="text-xs text-muted-foreground">min Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}