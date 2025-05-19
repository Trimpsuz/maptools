import CountrySelect from '@/components/CountrySelect';
import { ModeToggle } from '@/components/ModeToggle';
import CitySearch from '@/components/CitySearch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleConfig, Country } from '@/types';
import { Switch } from '@/components/ui/switch';
import RecapParser from './RecapParser';
import { SetStateAction } from 'react';
import ExcludedCountriesList from './ExcludedCountriesList';
import CirclesList from './CirclesList';

export default function Sidebar({
  sidebarOpen,
  minPopulation,
  setMinPopulation,
  country,
  setCountry,
  circles = [],
  setCircles,
  showPossibleCitiesOnly,
  setShowPossibleCitiesOnly,
  excludedCountries,
  setExcludedCountries,
}: {
  sidebarOpen: boolean;
  minPopulation: number;
  setMinPopulation: (minPopulation: number) => void;
  country: string | null;
  setCountry: (country: string | null) => void;
  circles: CircleConfig[];
  setCircles: (circles: SetStateAction<CircleConfig[]>) => void;
  showPossibleCitiesOnly: boolean;
  setShowPossibleCitiesOnly: (value: boolean) => void;
  excludedCountries: Country[];
  setExcludedCountries: (excludedCountries: Country[]) => void;
}) {
  const handleAddCircle = (circleConfig: CircleConfig) => {
    setCircles((prevCircles) => {
      const filteredCircles = prevCircles.filter((circle) => circle.city.id !== circleConfig.city.id);
      return [...filteredCircles, circleConfig];
    });
  };

  return (
    <aside
      className={`
    fixed top-0 right-0 h-full
    bg-background text-foreground shadow-lg
    transition-all duration-300 ease-in-out
    z-40
    md:static md:shadow-none
    ${sidebarOpen ? 'translate-x-0 md:w-80' : 'translate-x-full md:translate-x-0 md:w-14'}
    overflow-y-auto
    max-w-xs
  `}
    >
      <div className="flex flex-col gap-2 p-4 md:p-4 relative min-h-full">
        <div>
          <Label className="block text-sm font-medium mb-2">Min Population</Label>
          <Input
            type="number"
            className="w-full rounded p-2 border border-input bg-background text-foreground"
            value={minPopulation}
            min={0}
            step={1000}
            onChange={(e) => setMinPopulation(parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Country</Label>
          <CountrySelect value={country} onChange={setCountry} />
        </div>

        <CitySearch onAddCircle={handleAddCircle} minPopulation={minPopulation} excludedCountries={excludedCountries} setExcludedCountries={setExcludedCountries} setCountry={setCountry} />

        <div className="flex items-center space-x-2">
          <Switch id="show-possible-cities" checked={showPossibleCitiesOnly} onCheckedChange={setShowPossibleCitiesOnly} className="cursor-pointer" />
          <Label htmlFor="show-possible-cities" className="text-sm">
            Only show possible cities
          </Label>
        </div>

        <RecapParser
          minPopulation={minPopulation}
          excludedCountries={excludedCountries}
          setExcludedCountries={setExcludedCountries}
          onAddCircle={handleAddCircle}
          setCountry={setCountry}
          selectedCountry={country}
        />

        <ExcludedCountriesList excludedCountries={excludedCountries} setExcludedCountries={setExcludedCountries} />

        <CirclesList circles={circles} setCircles={setCircles} />

        <div className="mt-auto self-end">
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
}
