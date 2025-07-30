import { Button } from '@/components/ui/button';
import { CircleConfig } from '@/types';
import { Collapsible } from '@/components/ui/collapsible';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { SetStateAction, useState } from 'react';
import { ChevronDown, SquareSquare, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ExcludedCountriesList({ circles, setCircles }: { circles: CircleConfig[]; setCircles: (circles: SetStateAction<CircleConfig[]>) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const radiusEmojis = new Map([
    [250, '❌'],
    [100, '⭕'],
    [50, '🤏'],
    [20, '🤞'],
    [10, '💥'],
    [5, '🔍'],
    [null, '📍'],
  ]);

  return (
    <div className="flex flex-col w-full gap-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex flex-col w-full gap-2">
        <CollapsibleTrigger className="flex flex-row gap-2 items-center text-md font-medium cursor-pointer">
          Circles
          <ChevronDown className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
        </CollapsibleTrigger>
        <Button className="cursor-pointer" variant="destructive" onClick={() => setCircles([])}>
          <Trash2 />
          Clear All
        </Button>
        <CollapsibleContent>
          {circles.length > 0 ? (
            <ScrollArea className="rounded-md border max-h-60 overflow-auto">
              <div className="flex flex-col gap-2 p-2">
                {circles
                  .toSorted((a, b) => (a.redRadius ?? 0) - (b.redRadius ?? 0))
                  .map((circle, index) => (
                    <div key={index} className="flex flex-row items-center gap-2">
                      <p className="text-md text-foreground">
                        {radiusEmojis.get(circle.redRadius)} {circle.city.name.split(', ')[0]}, {circle.city.admin1Name ? `${circle.city.admin1Name},` : ''} {circle.city.countryCode}
                      </p>
                      <div className="ml-auto flex flex-row gap-2">
                        <Button
                          size={'sm'}
                          className="cursor-pointer"
                          onClick={() => {
                            const mapEvent = new CustomEvent('centerMap', {
                              detail: { lat: circle.city.latitude, lng: circle.city.longitude },
                            });
                            window.dispatchEvent(mapEvent);
                          }}
                        >
                          <SquareSquare />
                        </Button>
                        <Button size={'sm'} className="cursor-pointer" variant="destructive" onClick={() => setCircles(circles.filter((c) => c.city.id !== circle.city.id))}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-sm text-muted-foreground p-2">No circles yet</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
