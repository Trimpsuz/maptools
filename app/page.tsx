'use client';

import Sidebar from '@/components/Sidebar';
import { CircleConfig } from '@/types';
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

  useEffect(() => {
    const savedShowPossibleCitiesOnly = localStorage.getItem('showPossibleCitiesOnly');

    if (savedShowPossibleCitiesOnly) setShowPossibleCitiesOnly(JSON.parse(savedShowPossibleCitiesOnly));
  }, []);

  useEffect(() => {
    localStorage.setItem('showPossibleCitiesOnly', JSON.stringify(showPossibleCitiesOnly));
  }, [showPossibleCitiesOnly]);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);

  const handleAddCircle = (circleConfig: CircleConfig) => {
    setCircles((prevCircles) => {
      const filteredCircles = prevCircles.filter((circle) => circle.city.id !== circleConfig.city.id);
      return [...filteredCircles, circleConfig];
    });
  };

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

        <CityMap minPopulation={minPopulation} countries={country ?? 'all'} circles={circles} showPossibleCitiesOnly={showPossibleCitiesOnly} />
      </div>

      <Sidebar
        sidebarOpen={sidebarOpen}
        minPopulation={minPopulation}
        setMinPopulation={setMinPopulation}
        country={country}
        setCountry={setCountry}
        onAddCircle={handleAddCircle}
        showPossibleCitiesOnly={showPossibleCitiesOnly}
        setShowPossibleCitiesOnly={setShowPossibleCitiesOnly}
      />

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
