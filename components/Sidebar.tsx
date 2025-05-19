import CountrySelect from '@/components/CountrySelect';
import { ModeToggle } from '@/components/ModeToggle';
import CitySearch from '@/components/CitySearch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleConfig, Country } from '@/types';
import { Switch } from '@/components/ui/switch';
import RecapParser from './RecapParser';

export default function Sidebar({
  sidebarOpen,
  minPopulation,
  setMinPopulation,
  country,
  setCountry,
  onAddCircle,
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
  onAddCircle: (config: CircleConfig) => void;
  showPossibleCitiesOnly: boolean;
  setShowPossibleCitiesOnly: (value: boolean) => void;
  excludedCountries: Country[];
  setExcludedCountries: (excludedCountries: Country[]) => void;
}) {
  return (
    <aside
      className={`
          fixed top-0 right-0 h-full
          bg-background text-foreground shadow-lg
          transition-all duration-300 ease-in-out
          z-40
          md:static md:shadow-none
          ${sidebarOpen ? 'translate-x-0 md:w-80 md:p-4' : 'translate-x-full md:translate-x-0 md:w-14 md:p-2'}
          overflow-hidden
          flex flex-col
        `}
    >
      <div className="flex flex-col gap-2 p-4 md:p-0 flex-grow">
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

        <CitySearch onAddCircle={onAddCircle} minPopulation={minPopulation} />

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
          onAddCircle={onAddCircle}
          setCountry={setCountry}
          selectedCountry={country}
        />
      </div>

      <div className="ml-auto pb-4 pr-4 md:pb-0 md:pr-0">
        <ModeToggle />
      </div>
    </aside>
  );
}
