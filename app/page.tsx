'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ModeToggle } from '@/components/ModeToggle';
import CountrySelect from '@/components/CountrySelect';
import { Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CityMap = dynamic(() => import('@/components/CityMap'), { ssr: false });

export default function HomePage() {
  const [minPopulation, setMinPopulation] = useState(5000);
  const [country, setCountry] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

        <CityMap minPopulation={minPopulation} countries={country ?? 'all'} />
      </div>

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
        <div className="flex flex-col gap-4 p-4 md:p-0">
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

          <ModeToggle />
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
