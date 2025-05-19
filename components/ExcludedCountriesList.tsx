import { Button } from '@/components/ui/button';
import { Country } from '@/types';
import { Collapsible } from '@/components/ui/collapsible';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ExcludedCountriesList({ excludedCountries, setExcludedCountries }: { excludedCountries: Country[]; setExcludedCountries: (excludedCountries: Country[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full gap-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex flex-col w-full gap-2">
        <CollapsibleTrigger className="flex flex-row gap-2 items-center text-md font-medium cursor-pointer">
          Excluded Countries
          <ChevronDown className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </CollapsibleTrigger>
        <Button className="cursor-pointer" variant="destructive" onClick={() => setExcludedCountries([])}>
          <Trash2 />
          Clear all
        </Button>
        <CollapsibleContent>
          {excludedCountries.length > 0 ? (
            <ScrollArea className="rounded-md border max-h-60 overflow-auto">
              <div className="flex flex-col gap-2 p-2">
                {excludedCountries
                  .toSorted((a, b) => a.name.localeCompare(b.name))
                  .map((country, index) => (
                    <div key={index} className="flex flex-row items-center gap-2">
                      <p className="text-md text-foreground">{country.name}</p>
                      <Button size={'sm'} className="cursor-pointer ml-auto" variant="destructive" onClick={() => setExcludedCountries(excludedCountries.filter((c) => c.code !== country.code))}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-sm text-muted-foreground p-2">No countries excluded</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
