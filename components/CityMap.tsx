import { MapContainer, TileLayer, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import ClusterLayer from './ClusterLayer';
import CircleLayer from './CircleLayer';
import type { CircleConfig, City, Country } from '@/types';
import { calculateDistance, isPointWithinRadius } from '@/lib/utils';

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

export default function CityMap({
  minPopulation,
  countries,
  circles = [],
  showPossibleCitiesOnly = false,
  excludedCountries = [],
  equatorialLine = true,
  hemisphere = 'Both',
  continent,
  usState,
  excludedUsStates,
  closestGuess,
  useClosestGuess,
  loadingState,
  distanceBrackets,
}: {
  minPopulation: number;
  countries: string;
  circles: CircleConfig[];
  showPossibleCitiesOnly?: boolean;
  excludedCountries?: Country[];
  equatorialLine: boolean;
  hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere';
  continent: string | null;
  usState: string | null;
  excludedUsStates: string[];
  closestGuess: City | null;
  useClosestGuess: boolean;
  loadingState: boolean;
  distanceBrackets: number[];
}) {
  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cities?minPopulation=${minPopulation}&countries=all&gtc=true`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: countriesData = [], isLoading: countriesLoading } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
      if (!res.ok) throw new Error('Failed to load countries');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const visibleCities = useMemo(() => {
    if (!showPossibleCitiesOnly) {
      return cities;
    }

    const filteredCities = !countries || countries === 'all' ? cities : cities.filter((city) => city.countryCode === countries);

    const usedCityIds = new Set(circles.map((c) => c.city.id));

    return filteredCities.filter((city) => {
      if (usState && city.countryCode === 'US' && city.admin1 !== usState) return false;
      if (city.countryCode === 'US' && city.admin1 && excludedUsStates.includes(city.admin1)) return false;

      if (continent && countriesData.find((country) => country.code === city.countryCode)?.continent !== continent) return false;

      if (city.latitude < 0 && hemisphere === 'Northern Hemisphere') return false;
      if (city.latitude > 0 && hemisphere === 'Southern Hemisphere') return false;

      if (excludedCountries.some((country) => country.code === city.countryCode)) return false;

      if (city.name.toLowerCase().includes('estate') || city.alternateNames.split(';').some((s) => s.toLowerCase().includes('estate'))) return false;

      if (circles.length === 0) return true;

      if (usedCityIds.has(city.id)) return false;

      if (useClosestGuess && closestGuess) {
        const distanceToClosestGuess = calculateDistance(city.latitude, city.longitude, closestGuess.latitude, closestGuess.longitude);

        for (const circle of circles) {
          const distanceToCircle = calculateDistance(city.latitude, city.longitude, circle.city.latitude, circle.city.longitude);

          if (distanceToCircle < distanceToClosestGuess) {
            return false;
          }
        }
      }

      for (const circle of circles) {
        if (circle.redRadius != null && circle.city.latitude === city.latitude && circle.city.longitude === city.longitude) return false;

        if (circle.greenRadius > 0 && !isPointWithinRadius(city.latitude, city.longitude, circle.city.latitude, circle.city.longitude, circle.greenRadius)) {
          return false;
        }

        if (
          circle.redRadius != null &&
          isPointWithinRadius(city.latitude, city.longitude, circle.city.latitude, circle.city.longitude, circle.redRadius) &&
          (circle.redRadius < circle.greenRadius || !isPointWithinRadius(city.latitude, city.longitude, circle.city.latitude, circle.city.longitude, circle.greenRadius))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [circles, showPossibleCitiesOnly, excludedCountries, countries, cities, hemisphere, continent, countriesData, usState, closestGuess, useClosestGuess, excludedUsStates]);

  return (
    <MapContainer center={[35.6895, 139.6917]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      {loadingState == false && <ClusterLayer cities={visibleCities} distanceBrackets={distanceBrackets} useClosestGuess={useClosestGuess} />}
      <CircleLayer circles={circles} />
      {equatorialLine && (
        <Polyline
          positions={[
            [0, -180],
            [0, 180],
          ]}
          pathOptions={{ color: 'red', weight: 2 }}
        />
      )}
      <MapController centerOn={null} />
      {(citiesLoading || countriesLoading || loadingState) && <div className="absolute bottom-4 left-4 bg-background text-foreground px-3 py-1 rounded z-999">Loading cities...</div>}
    </MapContainer>
  );
}
