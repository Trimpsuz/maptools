import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SettingsIcon, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { deleteDB } from 'idb';
import { toast } from 'sonner';

export default function Settings({ useCache, setUseCache }: { useCache: boolean; setUseCache: (useCache: boolean) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Label className="text-md font-medium">Caching</Label>
        <div className="flex items-center gap-2">
          <Switch id="use-cache" checked={useCache} onCheckedChange={setUseCache} className="cursor-pointer" />
          <Label htmlFor="use-cache" className="text-sm">
            Use cache
          </Label>
        </div>
        <Button
          className="cursor-pointer"
          variant="destructive"
          onClick={async () => {
            await deleteDB('cities-cache');
            toast.success('Cache cleared');
          }}
        >
          <Trash2 />
          Clear cache
        </Button>
      </DialogContent>
    </Dialog>
  );
}
