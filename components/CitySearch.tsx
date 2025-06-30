import { useEffect, useState } from 'react';
import { SquareSquare, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import type { CircleConfig, City, Country } from '@/types';
import { findCity } from '@/lib/utils';
import { toast } from 'sonner';

export default function CitySearch({
  onAddCircle,
  minPopulation,
  excludedCountries,
  setExcludedCountries,
  country,
  setCountry,
  closestGuess,
  setClosestGuess,
  useClosestGuess,
  setUseClosestGuess,
  setUsState,
  excludedUsStates,
  setExcludedUsStates,
}: {
  onAddCircle: (config: CircleConfig) => void;
  minPopulation: number;
  excludedCountries: Country[];
  setExcludedCountries: (excludedCountries: Country[]) => void;
  country: string | null;
  setCountry: (country: string | null) => void;
  closestGuess: City | null;
  setClosestGuess: (closestGuess: City | null) => void;
  useClosestGuess: boolean;
  setUseClosestGuess: (useClosestGuess: boolean) => void;
  setUsState: (usState: string | null) => void;
  excludedUsStates: string[];
  setExcludedUsStates: (excludedUsStates: string[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [centerOnCircle, setCenterOnCircle] = useState(false);

  useEffect(() => {
    const savedCenterOnCircle = localStorage.getItem('centerOnCircle');

    if (savedCenterOnCircle) setCenterOnCircle(JSON.parse(savedCenterOnCircle));
  }, []);

  useEffect(() => {
    localStorage.setItem('centerOnCircle', JSON.stringify(centerOnCircle));
  }, [centerOnCircle]);

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

  const handleCircleButton = (redRadius: number | null, greenRadius: number) => {
    const city = findCity(searchQuery, countries, cities);
    if (typeof city === 'string') return toast.error(city);
    if (!city) return;

    onAddCircle({
      city,
      redRadius,
      greenRadius,
    });

    if (centerOnCircle) {
      const mapEvent = new CustomEvent('centerMap', {
        detail: { lat: city.latitude, lng: city.longitude },
      });
      window.dispatchEvent(mapEvent);
    }
  };

  const handleClosestGuess = () => {
    const city = findCity(searchQuery, countries, cities);
    if (typeof city === 'string') return toast.error(city);
    if (!city) return;

    setClosestGuess(city);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <Label className="block text-sm font-medium">Search City</Label>
        <div className="flex gap-2">
          <Input disabled={citiesLoading || countriesLoading} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="City, Region, Country" className="w-full" />
          <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="icon" onClick={() => setSearchQuery('')} title="Clear search">
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className={`grid ${useClosestGuess ? 'grid-cols-7' : 'grid-cols-6'} gap-1`}>
        {useClosestGuess && (
          <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleClosestGuess()}>
            ⬇️
          </Button>
        )}
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(100, 0)}>
          ❌
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(50, 100)}>
          🤏
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(20, 50)}>
          🤞
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(10, 20)}>
          💥
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(5, 10)}>
          🔍
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" onClick={() => handleCircleButton(null, 5)}>
          📍
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={citiesLoading || countriesLoading}
          className="cursor-pointer"
          onClick={() => {
            const city = findCity(searchQuery, countries, cities);
            if (typeof city === 'string') return toast.error(city);
            if (!city) return;

            const country = countries.find((country) => country.code === city.countryCode);
            if (!country) return toast.error(`Country not found: ${city.countryCode}`);

            setExcludedCountries([...excludedCountries, country]);
          }}
        >
          Exclude Country
        </Button>
        <Button
          disabled={citiesLoading || countriesLoading}
          className="cursor-pointer"
          onClick={() => {
            const city = findCity(searchQuery, countries, cities);
            if (typeof city === 'string') return toast.error(city);
            if (!city) return;

            const country = countries.find((country) => country.code === city.countryCode);
            if (!country) return toast.error(`Country not found: ${city.countryCode}`);

            setCountry(country.code);
          }}
        >
          Set Country
        </Button>
      </div>

      {country && country === 'US' && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={citiesLoading || countriesLoading}
            className="cursor-pointer"
            onClick={() => {
              const city = findCity(searchQuery, countries, cities);
              if (typeof city === 'string') return toast.error(city);
              if (!city) return;
              if (!city.admin1) return toast.error(`US state not found: ${city.countryCode}`);

              setExcludedUsStates([...excludedUsStates, city.admin1]);
            }}
          >
            Exclude State
          </Button>
          <Button
            disabled={citiesLoading || countriesLoading}
            className="cursor-pointer"
            onClick={() => {
              const city = findCity(searchQuery, countries, cities);
              if (typeof city === 'string') return toast.error(city);
              if (!city) return;
              if (!city.admin1) return toast.error(`US state not found: ${city.countryCode}`);

              setUsState(city.admin1);
            }}
          >
            Set State
          </Button>
        </div>
      )}

      {useClosestGuess && (
        <div className="flex flex-col">
          <Label className="block text-sm font-medium">Closest guess</Label>
          {closestGuess ? (
            <div className="flex flex-row items-center gap-2">
              <p className="text-md text-foreground">
                {closestGuess.name.split(', ')[0]}, {closestGuess.admin1Name ? `${closestGuess.admin1Name},` : ''} {closestGuess.countryCode}
              </p>
              <div className="ml-auto flex flex-row gap-2">
                <Button
                  size={'sm'}
                  className="cursor-pointer"
                  onClick={() => {
                    const mapEvent = new CustomEvent('centerMap', {
                      detail: { lat: closestGuess.latitude, lng: closestGuess.longitude },
                    });
                    window.dispatchEvent(mapEvent);
                  }}
                >
                  <SquareSquare />
                </Button>
                <Button size={'sm'} className="cursor-pointer" variant="destructive" onClick={() => setClosestGuess(null)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground p-2">No closest guess</div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Switch checked={useClosestGuess} onCheckedChange={setUseClosestGuess} id="center-on-circle" className="cursor-pointer" />
        <Label htmlFor="center-on-circle" className="text-sm">
          Use closest guess
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={centerOnCircle} onCheckedChange={setCenterOnCircle} id="center-on-circle" className="cursor-pointer" />
        <Label htmlFor="center-on-circle" className="text-sm">
          Center on circle
        </Label>
      </div>
    </div>
  );
}
