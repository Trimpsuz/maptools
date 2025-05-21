'use client';

import { useState } from 'react';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UsState } from '@/types';
import { usStates } from '@/lib/constants';

export default function UsStateSelect({ value, onChange }: { value: string | null; onChange: (value: string | null, usState?: UsState) => void }) {
  const [open, setOpen] = useState(false);

  const selectedUsState = usStates.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between cursor-pointer">
          {selectedUsState ? selectedUsState.name : 'All States'}
          <div className="flex items-center gap-2">
            {selectedUsState && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <X className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" />
              </div>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search state..." />
          <CommandList>
            {usStates.map((state) => (
              <CommandItem
                className="cursor-pointer"
                key={state.code}
                onSelect={() => {
                  onChange(state.code, state);
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', value === state.code ? 'opacity-100' : 'opacity-0')} />
                {state.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
