import { Button } from '@/components/ui/button';
import { Collapsible } from '@/components/ui/collapsible';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usStates } from '@/lib/constants';

export default function ExcludedUsStatesList({ excludedUsStates, setExcludedUsStates }: { excludedUsStates: string[]; setExcludedUsStates: (excludedUsStates: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full gap-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex flex-col w-full gap-2">
        <CollapsibleTrigger className="flex flex-row gap-2 items-center text-md font-medium cursor-pointer">
          Excluded States
          <ChevronDown className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </CollapsibleTrigger>
        <Button className="cursor-pointer" variant="destructive" onClick={() => setExcludedUsStates([])}>
          <Trash2 />
          Clear All
        </Button>
        <CollapsibleContent>
          {excludedUsStates.length > 0 ? (
            <ScrollArea className="rounded-md border max-h-60 overflow-auto">
              <div className="flex flex-col gap-2 p-2">
                {excludedUsStates
                  .map((code) => usStates.find((state) => state.code === code))
                  .filter((state): state is { code: string; name: string } => state !== undefined)
                  .toSorted((a, b) => a.name.localeCompare(b.name))
                  .map((state) => (
                    <div key={state.code} className="flex flex-row items-center gap-2">
                      <p className="text-md text-foreground">{state.name}</p>
                      <Button size="sm" className="cursor-pointer ml-auto" variant="destructive" onClick={() => setExcludedUsStates(excludedUsStates.filter((c) => c !== state.code))}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-sm text-muted-foreground p-2">No states excluded</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
