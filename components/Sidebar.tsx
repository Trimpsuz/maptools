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
import HemisphereSelect from './HemisphereSelect';
import ContinentSelect from './ContinentSelect';
import { buttonVariants } from '@/components/ui/button';
import { Github } from 'lucide-react';
import Link from 'next/link';

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
  equatorialLine,
  setEquatorialLine,
  hemisphere,
  setHemisphere,
  continent,
  setContinent,
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
  equatorialLine: boolean;
  setEquatorialLine: (equatorialLine: boolean) => void;
  hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere';
  setHemisphere: (hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere') => void;
  continent: string | null;
  setContinent: (continent: string | null) => void;
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

        <div>
          <Label className="block text-sm font-medium mb-2">Continent</Label>
          <ContinentSelect value={continent} onChange={setContinent} />
        </div>

        <div>
          <Label className="block text-sm font-medium mb-2">Hemisphere</Label>
          <HemisphereSelect hemisphere={hemisphere} setHemisphere={setHemisphere} />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="show-equatorial-line" checked={equatorialLine} onCheckedChange={setEquatorialLine} className="cursor-pointer" />
          <Label htmlFor="show-equatorial-line" className="text-sm">
            Show equatorial line
          </Label>
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
          setContinent={setContinent}
        />

        <ExcludedCountriesList excludedCountries={excludedCountries} setExcludedCountries={setExcludedCountries} />

        <CirclesList circles={circles} setCircles={setCircles} />

        <div className="mt-auto self-end flex flex-row gap-2">
          <Link className={buttonVariants({ variant: 'outline' })} href="https://github.com/trimpsuz/maptools" target="_blank">
            <Github />
          </Link>
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
}
