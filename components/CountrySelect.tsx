'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Country = {
  code: string;
  name: string;
};

type Props = {
  value: string | null;
  onChange: (value: string | null, countryData?: Country) => void;
};

export default function CountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const { data: countries = [], isLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      if (!res.ok) throw new Error('Failed to load countries');
      return res.json();
    },
  });

  const selectedCountry = countries.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between cursor-pointer">
          {selectedCountry ? selectedCountry.name : 'All Countries'}
          <div className="flex items-center gap-2">
            {selectedCountry && (
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
          <CommandInput placeholder="Search country..." />
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                {countries.map((country) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={country.code}
                    onSelect={() => {
                      onChange(country.code, country);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === country.code ? 'opacity-100' : 'opacity-0')} />
                    {country.name}
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
