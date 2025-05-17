import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import ClusterLayer from './ClusterLayer';
import type { City } from '@/types';

export default function CityMap({ minPopulation, countries }: { minPopulation: number; countries: string }) {
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation],
    queryFn: async () => {
      const res = await fetch(`/api/cities?minPopulation=${minPopulation}&countries=all`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
  });

  const filteredCities = useMemo(() => {
    if (!countries || countries === 'all') return cities;
    return cities.filter((city) => city.countryCode === countries);
  }, [cities, countries]);

  return (
    <MapContainer center={[35.6895, 139.6917]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClusterLayer cities={filteredCities} />
      {isLoading && <div className="absolute bottom-4 left-4 bg-background text-foreground px-3 py-1 rounded z-999">Loading cities...</div>}
    </MapContainer>
  );
}
