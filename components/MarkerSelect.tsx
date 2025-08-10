import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function MarkerSelect({ distanceBrackets, setDistanceBrackets }: { distanceBrackets: number[]; setDistanceBrackets: (distanceBrackets: number[]) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          Select markers
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select markers</DialogTitle>
          <DialogDescription>Select which markers should be enabled or disabled</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(250)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 250].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 250))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            ⭕ (250km)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(100)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 100].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 100))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            🤏 (100km)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(50)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 50].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 50))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            🤞 (50km)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(20)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 20].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 20))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            💥 (20km)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(10)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 10].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 10))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            🔍 (10km)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={distanceBrackets.includes(5)}
            onCheckedChange={(checked) => setDistanceBrackets(checked ? [...distanceBrackets, 5].sort((a, b) => b - a) : distanceBrackets.filter((distanceBracket) => distanceBracket !== 5))}
            id="center-on-circle"
            className="cursor-pointer"
          />
          <Label htmlFor="center-on-circle" className="text-sm">
            📍 (5km)
          </Label>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
