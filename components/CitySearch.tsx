import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import type { City, Country } from '@/types';
import { toast } from 'sonner';

type CircleConfig = {
  city: City;
  redRadius: number | null;
  greenRadius: number;
};

export default function CitySearch({ onAddCircle, minPopulation }: { onAddCircle: (config: CircleConfig) => void; minPopulation: number }) {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cities?minPopulation=${minPopulation}&countries=all`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const findCity = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a city name');
      return null;
    }

    let cityName = '';
    let regionName = '';
    let countryCode = '';

    const parts = searchQuery.split(',').map((part) => part.trim());

    if (parts.length === 1) {
      cityName = parts[0];
    } else if (parts.length === 2) {
      cityName = parts[0];
      const countryInput = parts[1];

      if (countryInput.length === 2) {
        countryCode = countryInput.toUpperCase();
      } else {
        const country = countries.find((c) => c.name.toLowerCase() === countryInput.toLowerCase());
        if (country) {
          countryCode = country.code;
        } else {
          toast.error('Country not found');
          return null;
        }
      }
    } else if (parts.length >= 3) {
      cityName = parts[0];
      regionName = parts[1];
      const countryInput = parts[2];

      if (countryInput.length === 2) {
        countryCode = countryInput.toUpperCase();
      } else {
        const country = countries.find((c) => c.name.toLowerCase() === countryInput.toLowerCase());
        if (country) {
          countryCode = country.code;
        } else {
          toast.error('Country not found');
          return null;
        }
      }
    }

    let filteredCities = cities.filter((city) => city.name.split(', ')[0].toLowerCase() === cityName.toLowerCase());

    if (countryCode) {
      filteredCities = filteredCities.filter((city) => city.countryCode === countryCode);
    }

    if (regionName) {
      filteredCities = filteredCities.filter((city) => city.admin1Name.toLowerCase().includes(regionName.toLowerCase()));
    }

    if (filteredCities.length === 0) {
      toast.error('City not found');
      return null;
    }

    return filteredCities.sort((a, b) => b.population - a.population)[0];
  };

  const handleCircleButton = (redRadius: number | null, greenRadius: number) => {
    const city = findCity();
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="block text-sm font-medium">Search City</Label>
        <div className="flex gap-2">
          <Input disabled={citiesLoading || countriesLoading} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="City, Region, Country" className="w-full" />
          <Button className="cursor-pointer" variant="outline" size="icon" onClick={() => setSearchQuery('')} title="Clear search">
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1">
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="100km radius" onClick={() => handleCircleButton(100, 0)}>
          ❌
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="50km red, 100km green" onClick={() => handleCircleButton(50, 100)}>
          🤏
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="50km red, 20km green" onClick={() => handleCircleButton(50, 20)}>
          🤞
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="20km red, 10km green" onClick={() => handleCircleButton(20, 10)}>
          💥
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="5km red, 10km green" onClick={() => handleCircleButton(5, 10)}>
          🔍
        </Button>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline" size="sm" title="5km green" onClick={() => handleCircleButton(null, 5)}>
          📍
        </Button>
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
