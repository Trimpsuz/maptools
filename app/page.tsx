'use client';

import Sidebar from '@/components/Sidebar';
import { AddCityCircleEvent, CircleConfig, City, ClosestGuessEvent, Country } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

const CityMap = dynamic(() => import('@/components/CityMap'), {
  ssr: false,
});

export default function HomePage() {
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
