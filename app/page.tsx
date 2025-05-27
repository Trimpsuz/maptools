'use client';

import Sidebar from '@/components/Sidebar';
import { AddCityCircleEvent, CircleConfig, City, ClosestGuessEvent, Country } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const CityMap = dynamic(() => import('@/components/CityMap'), {
  ssr: false,
});

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [minPopulation, setMinPopulation] = useState(5000);
  const [country, setCountry] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [circles, setCircles] = useState<CircleConfig[]>([]);
  const [showPossibleCitiesOnly, setShowPossibleCitiesOnly] = useState(false);
  const [excludedCountries, setExcludedCountries] = useState<Country[]>([]);
  const [equatorialLine, setEquatorialLine] = useState(true);
  const [hemisphere, setHemisphere] = useState<'Both' | 'Northern Hemisphere' | 'Southern Hemisphere'>('Both');
  const [continent, setContinent] = useState<string | null>(null);
  const [usState, setUsState] = useState<string | null>(null);
  const [excludedUsStates, setExcludedUsStates] = useState<string[]>([]);
  const [closestGuess, setClosestGuess] = useState<City | null>(null);
  const [useClosestGuess, setUseClosestGuess] = useState(false);
  const [stateId, setStateId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    if (country !== 'US') setUsState(null);
  }, [country]);

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cities?minPopulation=${minPopulation}&countries=all`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: countries = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
      if (!res.ok) throw new Error('Failed to load countries');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleAddCircle = useCallback((circleConfig: CircleConfig) => {
    setCircles((prevCircles) => {
      const filteredCircles = prevCircles.filter((circle) => circle.city.id !== circleConfig.city.id);
      return [...filteredCircles, circleConfig];
    });
  }, []);

  useEffect(() => {
    const savedShowPossibleCitiesOnly = localStorage.getItem('showPossibleCitiesOnly');
    const savedEquatorialLine = localStorage.getItem('equatorialLine');
    const savedUseClosestGuess = localStorage.getItem('useClosestGuess');

    if (savedShowPossibleCitiesOnly) setShowPossibleCitiesOnly(JSON.parse(savedShowPossibleCitiesOnly));
    if (savedEquatorialLine) setEquatorialLine(JSON.parse(savedEquatorialLine));
    if (savedUseClosestGuess) setUseClosestGuess(JSON.parse(savedUseClosestGuess));
  }, []);

  useEffect(() => {
    localStorage.setItem('showPossibleCitiesOnly', JSON.stringify(showPossibleCitiesOnly));
    localStorage.setItem('equatorialLine', JSON.stringify(equatorialLine));
    localStorage.setItem('useClosestGuess', JSON.stringify(useClosestGuess));
  }, [showPossibleCitiesOnly, equatorialLine, useClosestGuess]);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);

  const citiesRef = useRef(cities);
  const citiesLoadingRef = useRef(citiesLoading);
  const handleAddCircleRef = useRef(handleAddCircle);

  useEffect(() => {
    citiesRef.current = cities;
    citiesLoadingRef.current = citiesLoading;
    handleAddCircleRef.current = handleAddCircle;
  }, [cities, citiesLoading, handleAddCircle]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as AddCityCircleEvent;
      if (citiesLoadingRef.current) return;

      const city = citiesRef.current.find((city) => city.id === customEvent.detail.id);
      if (!city) return;

      handleAddCircleRef.current({
        city,
        redRadius: customEvent.detail.redRadius,
        greenRadius: customEvent.detail.greenRadius,
      });
    };

    document.addEventListener('addCityCircle', handler);
    return () => document.removeEventListener('addCityCircle', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as ClosestGuessEvent;
      if (citiesLoadingRef.current) return;

      const city = citiesRef.current.find((city) => city.id === customEvent.detail.id);
      if (!city) return;

      setClosestGuess(city);
    };

    document.addEventListener('closestGuess', handler);
    return () => document.removeEventListener('closestGuess', handler);
  }, []);

  useEffect(() => {
    const stateId = searchParams.get('state');

    if (stateId) {
      setLoadingState(true);
      setStateId(stateId);
    } else {
      setLoadingState(false);
      setStateId(null);
    }
  }, [searchParams, setLoadingState, setStateId]);

  useEffect(() => {
    if (stateId && stateId.trim() != '' && !citiesLoading && !countriesLoading && cities && countries && loadingState) {
      if (stateId.trim() === '') {
        toast.error('Invalid state ID in URL.');
        return;
      }

      const fetchState = async () => {
        try {
          const response = await fetch(`/api/load/${stateId}`, {
            method: 'GET',
          });

          if (response.status !== 200) {
            const errorData = await response.json();
            return toast.error(errorData.error);
          }

          const state = await response.json();

          if (state.country != null) setCountry(state.country);
          if (state.incorrectGuesses.countries.length !== 0)
            setExcludedCountries(state.incorrectGuesses.countries.map((code: string) => countries.find((c) => c.code === code)).filter(Boolean) as Country[]);
          if (state.incorrectGuesses.usStates.length !== 0) setExcludedUsStates(state.incorrectGuesses.usStates);
          if (state.hemisphere != null) setHemisphere(state.hemisphere);
          if (state.continent != null) setContinent(state.continent);
          if (state.usState != null) setUsState(state.usState);

          if (state.closestGuess != null) {
            const closestGuess = cities.find((c) => c.id === state.closestGuess);
            if (closestGuess) setClosestGuess(closestGuess);
          }

          const handleCities = (ids: string[], redRadius: number | null, greenRadius: number) => {
            for (const id of ids) {
              const city = cities.find((c) => c.id === id);
              if (!city) {
                toast.error(`City ${id} not found`);
                continue;
              }
              handleAddCircle({ city, redRadius, greenRadius });
            }
          };

          handleCities(state.incorrectGuesses.incorrect, 100, 0);
          handleCities(state.incorrectGuesses['100km'], 50, 100);
          handleCities(state.incorrectGuesses['50km'], 20, 50);
          handleCities(state.incorrectGuesses['20km'], 10, 20);
          handleCities(state.incorrectGuesses['10km'], 5, 10);
          handleCities(state.incorrectGuesses['5km'], null, 5);
        } catch (error) {
          toast.error('An error occurred while loading state.');
          console.error(error);
        }
      };

      fetchState();

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('state');

      router.replace(`?${newParams.toString()}`, { scroll: false });

      setLoadingState(false);
    }
  }, [
    stateId,
    citiesLoading,
    countriesLoading,
    cities,
    countries,
    handleAddCircle,
    searchParams,
    router,
    setCountry,
    setExcludedCountries,
    setExcludedUsStates,
    setHemisphere,
    setContinent,
    setUsState,
    setClosestGuess,
    loadingState,
    setLoadingState,
  ]);

  return (
    <div className="flex h-screen">
      <div className="flex-1 relative">
        {!sidebarOpen ? (
          <button
            className="md:hidden absolute top-4 right-4 z-50 p-2 rounded bg-background text-foreground shadow-md hover:opacity-90 transition-opacity"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
        ) : null}

        <CityMap
          minPopulation={minPopulation}
          countries={country ?? 'all'}
          circles={circles}
          showPossibleCitiesOnly={showPossibleCitiesOnly}
          excludedCountries={excludedCountries}
          equatorialLine={equatorialLine}
          hemisphere={hemisphere}
          continent={continent}
          usState={usState}
          excludedUsStates={excludedUsStates}
          closestGuess={closestGuess}
          useClosestGuess={useClosestGuess}
          loadingState={loadingState}
        />
      </div>

      <Sidebar
        sidebarOpen={sidebarOpen}
        minPopulation={minPopulation}
        setMinPopulation={setMinPopulation}
        country={country}
        setCountry={setCountry}
        circles={circles}
        setCircles={setCircles}
        showPossibleCitiesOnly={showPossibleCitiesOnly}
        setShowPossibleCitiesOnly={setShowPossibleCitiesOnly}
        excludedCountries={excludedCountries}
        setExcludedCountries={setExcludedCountries}
        equatorialLine={equatorialLine}
        setEquatorialLine={setEquatorialLine}
        hemisphere={hemisphere}
        setHemisphere={setHemisphere}
        continent={continent}
        setContinent={setContinent}
        usState={usState}
        excludedUsStates={excludedUsStates}
        setExcludedUsStates={setExcludedUsStates}
        setUsState={setUsState}
        closestGuess={closestGuess}
        setClosestGuess={setClosestGuess}
        useClosestGuess={useClosestGuess}
        setUseClosestGuess={setUseClosestGuess}
      />

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
