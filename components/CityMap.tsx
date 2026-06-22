'use client';

import type { CircleConfig, City, Country } from '@/types';
import { useMapGeoData } from '../hooks/useMapGeodata';
import { useMapInstance } from '../hooks/useMapInstance';

export interface CityMapProps {
  minPopulation: number;
  countries: string;
  circles?: CircleConfig[];
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
  useCache: boolean;
}

function LoadingOverlay() {
  return (
    <div className="absolute bottom-4 left-4 bg-background text-foreground px-3 py-1 rounded z-999">
      Loading cities...
    </div>
  );
}

export default function CityMap({
  minPopulation,
  countries,
  circles = [],
  showPossibleCitiesOnly = false,
  excludedCountries = [],
  equatorialLine,
  hemisphere,
  continent,
  usState,
  excludedUsStates,
  closestGuess,
  useClosestGuess,
  loadingState,
  distanceBrackets,
  useCache,
}: CityMapProps) {
  const {
    cityData,
    circleData,
    equatorData,
    visibleCities,
    countriesData,
    citiesLoading,
    countriesLoading,
  } = useMapGeoData({
    minPopulation,
    countries,
    circles,
    showPossibleCitiesOnly,
    excludedCountries,
    equatorialLine,
    hemisphere,
    continent,
    usState,
    excludedUsStates,
    closestGuess,
    useClosestGuess,
    loadingState,
    useCache,
  });

  const { mapContainerRef } = useMapInstance({
    cityData,
    circleData,
    equatorData,
    visibleCities,
    countriesData,
    distanceBrackets,
    useClosestGuess,
  });

  const isLoading = citiesLoading || countriesLoading || loadingState;

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {isLoading && <LoadingOverlay />}
    </div>
  );
}
