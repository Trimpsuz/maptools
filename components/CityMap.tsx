import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import ClusterLayer from './ClusterLayer';
import CircleLayer from './CircleLayer';
import type { CircleConfig, City } from '@/types';

function MapController({ centerOn }: { centerOn: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (centerOn) {
      map.setView([centerOn.lat, centerOn.lng], 10);
    }
  }, [centerOn, map]);

  useEffect(() => {
    const handleCenterMap = (e: CustomEvent) => {
      const { lat, lng } = e.detail;
      map.setView([lat, lng], 10);
    };

    window.addEventListener('centerMap', handleCenterMap as EventListener);

    return () => {
      window.removeEventListener('centerMap', handleCenterMap as EventListener);
    };
  }, [map]);

  return null;
}

export default function CityMap({ minPopulation, countries, circles = [] }: { minPopulation: number; countries: string; circles: CircleConfig[] }) {
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cities?minPopulation=${minPopulation}&countries=all`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const filteredCities = useMemo(() => {
    if (!countries || countries === 'all') return cities;
    return cities.filter((city) => city.countryCode === countries);
  }, [cities, countries]);

  return (
    <MapContainer center={[35.6895, 139.6917]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClusterLayer cities={filteredCities} />
      <CircleLayer circles={circles} />
      <MapController centerOn={null} />
      {isLoading && <div className="absolute bottom-4 left-4 bg-background text-foreground px-3 py-1 rounded z-999">Loading cities...</div>}
    </MapContainer>
  );
}
