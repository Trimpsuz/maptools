'use client';

import { useState } from 'react';
import { Command, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CountrySelect({
  hemisphere,
  setHemisphere,
}: {
  hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere';
  setHemisphere: (hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere') => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between cursor-pointer">
          {hemisphere}
          <div className="flex items-center gap-2">
            {hemisphere !== 'Both' && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHemisphere('Both');
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
          <CommandList>
            <CommandItem
              className="cursor-pointer"
              key="Both"
              onSelect={() => {
                setHemisphere('Both');
                setOpen(false);
              }}
            >
              <Check className={cn('mr-2 h-4 w-4', hemisphere === 'Both' ? 'opacity-100' : 'opacity-0')} />
              Both
            </CommandItem>
            <CommandItem
              className="cursor-pointer"
              key="Northern Hemisphere"
              onSelect={() => {
                setHemisphere('Northern Hemisphere');
                setOpen(false);
              }}
            >
              <Check className={cn('mr-2 h-4 w-4', hemisphere === 'Northern Hemisphere' ? 'opacity-100' : 'opacity-0')} />
              Northern Hemisphere
            </CommandItem>
            <CommandItem
              className="cursor-pointer"
              key="Southern Hemisphere"
              onSelect={() => {
                setHemisphere('Southern Hemisphere');
                setOpen(false);
              }}
            >
              <Check className={cn('mr-2 h-4 w-4', hemisphere === 'Southern Hemisphere' ? 'opacity-100' : 'opacity-0')} />
              Southern Hemisphere
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
