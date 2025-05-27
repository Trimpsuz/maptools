import { Button } from '@/components/ui/button';
import { CircleCheck, Copy, Download, Link, Loader2, SaveAll, Upload } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { CircleConfig, City, Country } from '@/types';
import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export default function LoadSave({
  minPopulation,
  country,
  circles = [],
  excludedCountries,
  hemisphere,
  continent,
  usState,
  closestGuess,
  excludedUsStates,
  setCountry,
  setExcludedCountries,
  setHemisphere,
  setContinent,
  setUsState,
  setClosestGuess,
  setExcludedUsStates,
  onAddCircle,
}: {
  minPopulation: number;
  country: string | null;
  setCountry: (country: string | null) => void;
  circles: CircleConfig[];
  excludedCountries: Country[];
  setExcludedCountries: (excludedCountries: Country[]) => void;
  hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere';
  setHemisphere: (hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere') => void;
  continent: string | null;
  setContinent: (continent: string | null) => void;
  usState: string | null;
  setUsState: (usState: string | null) => void;
  closestGuess: City | null;
  setClosestGuess: (closestGuess: City | null) => void;
  excludedUsStates: string[];
  setExcludedUsStates: (excludedUsStates: string[]) => void;
  onAddCircle: (config: CircleConfig) => void;
}) {
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

  const [open, setOpen] = useState(false);
  const [loadFromString, setLoadFromString] = useState('');
  const [saveString, setSaveString] = useState('');
  const [useLink, setUseLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingLoad, setLoadingLoad] = useState(false);

  useEffect(() => {
    const savedUseLink = localStorage.getItem('useLink');

    if (savedUseLink) setUseLink(JSON.parse(savedUseLink));
  }, []);

  useEffect(() => {
    localStorage.setItem('useLink', JSON.stringify(useLink));
  }, [useLink]);

  useEffect(() => {
    if (open) {
      setLoadFromString('');
      setSaveString('');
      setCopied(false);
      setLoadingSave(false);
    }
  }, [open]);

  const onCopy = () => {
    navigator.clipboard.writeText(useLink ? `https://maptools.trimpsuz.dev/?state=${saveString}` : saveString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const saveState = async () => {
    const incorrectGuesses = {
      countries: excludedCountries.map((c) => c.code),
      usStates: excludedUsStates,
      incorrect: circles.filter((c) => c.redRadius == 100).map((c) => c.city.id),
      '100km': circles.filter((c) => c.redRadius == 50).map((c) => c.city.id),
      '50km': circles.filter((c) => c.redRadius == 20).map((c) => c.city.id),
      '20km': circles.filter((c) => c.redRadius == 10).map((c) => c.city.id),
      '10km': circles.filter((c) => c.redRadius == 5).map((c) => c.city.id),
      '5km': circles.filter((c) => c.redRadius == null).map((c) => c.city.id),
    };

    const state = {
      country,
      incorrectGuesses,
      hemisphere,
      continent,
      usState,
      closestGuess: closestGuess ? closestGuess.id : null,
    };

    setLoadingSave(true);

    const response = await fetch('/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    });

    if (response.status != 200) {
      toast.error((await response.json()).error);
      setLoadingSave(false);
      return;
    }

    setSaveString((await response.json()).state);

    setLoadingSave(false);
  };

  const loadState = async () => {
    setLoadingLoad(true);

    if (loadFromString.trim() === '') {
      toast.error('Please enter a valid state ID.');
      return;
    }

    const response = await fetch(`/api/load/${loadFromString}`, {
      method: 'GET',
    });

    if (response.status != 200) {
      toast.error((await response.json()).error);
      setLoadingLoad(false);
      return;
    }

    const state = await response.json();

    if (state.country != null) setCountry(state.country);
    if (state.incorrectGuesses.countries.length != 0) setExcludedCountries(state.incorrectGuesses.countries.map((code: string) => countries.find((c) => c.code == code) as Country));
    if (state.incorrectGuesses.usStates.length != 0) setExcludedUsStates(state.incorrectGuesses.usStates);
    if (state.hemisphere != null) setHemisphere(state.hemisphere);
    if (state.continent != null) setContinent(state.continent);
    if (state.usState != null) setUsState(state.usState);
    if (state.closestGuess != null) {
      const closestGuess = cities.find((c) => c.id == state.closestGuess);
      if (closestGuess) setClosestGuess(closestGuess);
    }

    for (const id of state.incorrectGuesses.incorrect) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: 100, greenRadius: 0 });
    }

    for (const id of state.incorrectGuesses['100km']) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: 50, greenRadius: 100 });
    }

    for (const id of state.incorrectGuesses['50km']) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: 20, greenRadius: 50 });
    }

    for (const id of state.incorrectGuesses['20km']) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: 10, greenRadius: 20 });
    }

    for (const id of state.incorrectGuesses['10km']) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: 5, greenRadius: 10 });
    }

    for (const id of state.incorrectGuesses['5km']) {
      const city = cities.find((c) => c.id == id);
      if (!city) {
        toast.error(`City ${id} not found`);
        continue;
      }
      onAddCircle({ city, redRadius: null, greenRadius: 5 });
    }

    setLoadingLoad(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={citiesLoading || countriesLoading} className="cursor-pointer" variant="outline">
          <SaveAll />
          Save/Load State
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load or Save State</DialogTitle>
          <DialogDescription>Save the current state to a key so you can load it later or load from an existing key</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input disabled={citiesLoading || countriesLoading} value={loadFromString} onChange={(e) => setLoadFromString(e.target.value)} placeholder="State key" className="w-full" />
          {loadingLoad ? (
            <Button size="icon" disabled>
              <Loader2 className="animate-spin" />
            </Button>
          ) : (
            <Button disabled={citiesLoading || countriesLoading} size="icon" className="cursor-pointer" onClick={() => loadState()}>
              <Download />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {saveString ? (
            <>
              <div className="flex items-center gap-2">
                <Link size={18} />
                <Switch checked={useLink} onCheckedChange={setUseLink} id="use-link" className="cursor-pointer" />
              </div>
              <Input disabled={citiesLoading || countriesLoading} value={useLink ? `https://maptools.trimpsuz.dev/?state=${saveString}` : saveString} readOnly className="w-full" />
              <Button size="sm" className="cursor-pointer" onClick={() => onCopy()}>
                <span className="sr-only">Copy</span>
                {copied ? <CircleCheck /> : <Copy />}
              </Button>
            </>
          ) : loadingSave ? (
            <Button disabled className="w-full">
              <Loader2 className="animate-spin" />
              Loading
            </Button>
          ) : (
            <Button disabled={citiesLoading || countriesLoading || loadingLoad} className="cursor-pointer w-full" onClick={() => saveState()}>
              <Upload />
              Save State
            </Button>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
