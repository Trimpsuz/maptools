'use client';

import Sidebar from '@/components/Sidebar';
import { CircleConfig, Country } from '@/types';
import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const savedShowPossibleCitiesOnly = localStorage.getItem('showPossibleCitiesOnly');
    const savedEquatorialLine = localStorage.getItem('equatorialLine');

    if (savedShowPossibleCitiesOnly) setShowPossibleCitiesOnly(JSON.parse(savedShowPossibleCitiesOnly));
    if (savedEquatorialLine) setEquatorialLine(JSON.parse(savedEquatorialLine));
  }, []);

  useEffect(() => {
    localStorage.setItem('showPossibleCitiesOnly', JSON.stringify(showPossibleCitiesOnly));
    localStorage.setItem('equatorialLine', JSON.stringify(equatorialLine));
  }, [showPossibleCitiesOnly, equatorialLine]);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
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
      />

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
