'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Continent } from '@/types';

export default function ContinentSelect({ value, onChange }: { value: string | null; onChange: (value: string | null, continentData?: Continent) => void }) {
  const [open, setOpen] = useState(false);

  const { data: continents = [], isLoading } = useQuery<Continent[]>({
    queryKey: ['continents'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/continents`);
      if (!res.ok) throw new Error('Failed to load continents');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const selectedContinent = continents.find((c) => c.continent === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between cursor-pointer">
          {selectedContinent ? selectedContinent.name : 'All Continents'}
          <div className="flex items-center gap-2">
            {selectedContinent && (
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
          <CommandInput placeholder="Search continent..." />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                {continents.map((continent) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={continent.continent}
                    onSelect={() => {
                      onChange(continent.continent, continent);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === continent.continent ? 'opacity-100' : 'opacity-0')} />
                    {continent.name}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
