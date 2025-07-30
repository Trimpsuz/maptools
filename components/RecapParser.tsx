import { Textarea } from '@/components/ui/textarea';
import { CircleConfig, City, Continent, Country } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { findCity } from '@/lib/utils';
import anyAscii from 'any-ascii';
import { Trash2 } from 'lucide-react';
import { usStates } from '@/lib/constants';

export default function RecapParser({
  minPopulation,
  excludedCountries,
  setExcludedCountries,
  onAddCircle,
  setCountry,
  selectedCountry,
  setContinent,
  setUsState,
  excludedUsStates,
  setExcludedUsStates,
  setClosestGuess,
}: {
  minPopulation: number;
  excludedCountries: Country[];
  setExcludedCountries: (excludedCountries: Country[]) => void;
  onAddCircle: (config: CircleConfig) => void;
  setCountry: (country: string | null) => void;
  selectedCountry: string | null;
  setContinent: (continent: string | null) => void;
  setUsState: (usState: string | null) => void;
  excludedUsStates: string[];
  setExcludedUsStates: (excludedUsStates: string[]) => void;
  setClosestGuess: (closestGuess: City | null) => void;
}) {
  const [recap, setRecap] = useState('');

  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
      if (!res.ok) throw new Error('Failed to load countries');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cities?minPopulation=${minPopulation}&countries=all&gtc=true`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: continents = [], isLoading: continentsLoading } = useQuery<Continent[]>({
    queryKey: ['continents'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/continents`);
      if (!res.ok) throw new Error('Failed to load continents');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  function parseRecap() {
    if (recap.trim() === '') toast.error('Empty recap, please paste a recap');

    const newExcludedCountries: Country[] = [...excludedCountries];
    const newExcludedUsStates: string[] = [...excludedUsStates];

    let country: string | null = selectedCountry;

    const checkedCities = new Set<City>();

    for (const [index, line] of recap.split('\n').entries()) {
      if (line.trim() === '') continue;

      if (line.toLowerCase().includes('country: ')) {
        // Country line
        const _country = countries.find((country) => anyAscii(country.name.toLowerCase()) === anyAscii(line.toLowerCase().split('country:')[1].split('hint from')[0].trim()));
        if (_country) {
          setCountry(_country.code);
          country = _country.code;
        } else toast.error(`Error in recap on line ${index + 1}`, { description: `Country not found: ${line.toLowerCase().split('country:')[1].trim()}` });
      } else if (line.toLowerCase().includes('answer is not in ')) {
        // Not in country/state line
        const _country = countries.find((country) => anyAscii(country.name.toLowerCase()) === anyAscii(line.toLowerCase().split('is not in')[1].trim()));
        if (_country && newExcludedCountries.includes(_country)) continue;
        if (_country) newExcludedCountries.push(_country);
        else {
          if (country === 'US') {
            const usState = usStates.find((usState) => usState.name.toLowerCase() === line.toLowerCase().split('is not in')[1].trim());
            if (usState && newExcludedUsStates.includes(usState.code)) continue;
            if (usState) newExcludedUsStates.push(usState.code);
            // This is disabled for now because recap shows admin1 of any countries guessed not just US states
            /*else toast.error(`Error in recap on line ${index + 1}`, { description: `US state not found: ${line.toLowerCase().split('is not in')[1].trim()}` });*/
          } else toast.error(`Error in recap on line ${index + 1}`, { description: `Country not found: ${line.toLowerCase().split('is not in')[1].trim()}` });
        }
      } else if (line.toLocaleLowerCase().includes('us state: ')) {
        // US state line
        if (!country || country !== 'US') {
          toast.error(`Error in recap on line ${index + 1}`, { description: 'Cannot use US state outside of US' });
        } else {
          const usState = usStates.find((usState) => usState.name.toLowerCase() === line.toLowerCase().split('us state:')[1].trim());
          if (usState) setUsState(usState.code);
          else toast.error(`Error in recap on line ${index + 1}`, { description: `US state not found: ${line.toLowerCase().split('us state:')[1].trim()}` });
        }
      } else if (line.toLocaleLowerCase().includes('closest guess: ')) {
        // Closest guess line
        const city = findCity(line.toLowerCase().split('closest guess:')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else setClosestGuess(city);
      } else if (line.toLowerCase().includes('answer is under 250km away from ')) {
        // Within 250km (⭕) line

        const city = findCity(line.toLowerCase().split('answer is under 250km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: 100,
            greenRadius: 250,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is under 100km away from ')) {
        // Within 100km (🤏) line

        const city = findCity(line.toLowerCase().split('answer is under 100km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: 50,
            greenRadius: 100,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is under 50km away from ')) {
        // Within 50km (🤞) line
        const city = findCity(line.toLowerCase().split('answer is under 50km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: 20,
            greenRadius: 50,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is under 20km away from ')) {
        // Within 20km (💥) line
        const city = findCity(line.toLowerCase().split('answer is under 20km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: 10,
            greenRadius: 20,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is under 10km away from ')) {
        // Within 10km (🔍) line
        const city = findCity(line.toLowerCase().split('answer is under 10km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: 5,
            greenRadius: 10,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is under 5km away from ')) {
        // Within 5km (📍) line
        const city = findCity(line.toLowerCase().split('answer is under 5km away from')[1].trim(), countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          onAddCircle({
            city,
            redRadius: null,
            greenRadius: 5,
          });
          checkedCities.add(city);
        }
      } else if (line.toLowerCase().includes('answer is not ')) {
        // Not within 250km (❌) line
        if (!country) {
          toast.error(`Error in recap on line ${index + 1}`, { description: 'Cannot recap individual cities without a country' });
          continue;
        }

        const city = findCity(`${line.toLowerCase().split('answer is not')[1].trim()}, ${country}`, countries, cities);

        if (typeof city === 'string') toast.error(`Error in recap on line ${index + 1}`, { description: city });
        else {
          if (checkedCities.has(city)) continue; // This is required because even if a city is within <=100km it still has the "answer is not" line
          onAddCircle({
            city,
            redRadius: 250,
            greenRadius: 0,
          });
        }
      } else if (line.toLowerCase().includes('continent: ')) {
        // Continent hint line
        const continent = continents.find((c) => anyAscii(c.name.toLowerCase()) === anyAscii(line.toLowerCase().split('continent:')[1].split('hint from')[0].trim()));

        if (!continent) {
          toast.error(`Error in recap on line ${index + 1}`, { description: 'Continent not found' });
          continue;
        }

        setContinent(continent.continent);
      }
    }

    setExcludedCountries(newExcludedCountries);
    setExcludedUsStates(newExcludedUsStates);
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <Label className="block text-sm font-medium">Parse Recap</Label>
      <Textarea className="h-40" disabled={countriesLoading || citiesLoading || continentsLoading} placeholder="Paste /recap content here" value={recap} onChange={(e) => setRecap(e.target.value)} />
      <div className="flex flex-row gap-2 w-full">
        <Button className="cursor-pointer flex-grow" disabled={countriesLoading || citiesLoading || continentsLoading} onClick={() => parseRecap()}>
          Parse Recap
        </Button>
        <Button disabled={countriesLoading || citiesLoading || continentsLoading} variant="outline" size="icon" className="cursor-pointer" onClick={() => setRecap('')}>
          <Trash2 />
          <span className="sr-only">Clear Recap</span>
        </Button>
      </div>
    </div>
  );
}
