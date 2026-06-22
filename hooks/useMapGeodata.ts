import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { GeoJSON } from 'geojson';
import type { CircleConfig, City, Country } from '@/types';
import {
  calculateDistance,
  fetchCities,
  isPointWithinRadius,
} from '@/lib/utils';
import { createCityData, createCircleData } from '../lib/cityMapUtils';

export interface UseMapGeoDataProps {
  minPopulation: number;
  countries: string;
  circles: CircleConfig[];
  showPossibleCitiesOnly: boolean;
  excludedCountries: Country[];
  equatorialLine: boolean;
  hemisphere: 'Both' | 'Northern Hemisphere' | 'Southern Hemisphere';
  continent: string | null;
  usState: string | null;
  excludedUsStates: string[];
  closestGuess: City | null;
  useClosestGuess: boolean;
  loadingState: boolean;
  useCache: boolean;
}

export interface UseMapGeoDataResult {
  cityData: GeoJSON.FeatureCollection;
  circleData: GeoJSON.FeatureCollection;
  equatorData: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  visibleCities: City[];
  countriesData: Country[];
  citiesLoading: boolean;
  countriesLoading: boolean;
}

async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`);
  if (!res.ok) throw new Error('Failed to load countries');
  return res.json();
}

export function useMapGeoData({
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
}: UseMapGeoDataProps): UseMapGeoDataResult {
  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation, useCache],
    queryFn: () => fetchCities(minPopulation, useCache),
    refetchOnWindowFocus: false,
  });

  const { data: countriesData = [], isLoading: countriesLoading } = useQuery<
    Country[]
  >({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    refetchOnWindowFocus: false,
  });

  const visibleCities = useMemo(() => {
    if (!showPossibleCitiesOnly) return cities;

    const filteredByCountry =
      !countries || countries === 'all'
        ? cities
        : cities.filter((city) => city.countryCode === countries);

    const usedCityIds = new Set(circles.map((c) => c.city.id));

    return filteredByCountry.filter((city) => {
      // US state
      if (usState && city.countryCode === 'US' && city.admin1 !== usState)
        return false;
      if (
        city.countryCode === 'US' &&
        city.admin1 &&
        excludedUsStates.includes(city.admin1)
      )
        return false;

      // Continent / hemisphere / country filters
      if (
        continent &&
        countriesData.find((c) => c.code === city.countryCode)?.continent !==
          continent
      )
        return false;
      if (city.latitude < 0 && hemisphere === 'Northern Hemisphere')
        return false;
      if (city.latitude > 0 && hemisphere === 'Southern Hemisphere')
        return false;
      if (excludedCountries.some((c) => c.code === city.countryCode))
        return false;

      // Exclude estates
      if (
        city.name.toLowerCase().includes('estate') ||
        city.alternateNames
          .split(';')
          .some((s) => s.toLowerCase().includes('estate'))
      )
        return false;

      if (circles.length === 0) return true;

      // Already used
      if (usedCityIds.has(city.id)) return false;

      // Closest guess
      if (useClosestGuess && closestGuess) {
        const distToGuess = calculateDistance(
          city.latitude,
          city.longitude,
          closestGuess.latitude,
          closestGuess.longitude,
        );
        for (const circle of circles) {
          const distToCircle = calculateDistance(
            city.latitude,
            city.longitude,
            circle.city.latitude,
            circle.city.longitude,
          );
          if (distToCircle < distToGuess) return false;
        }
      }

      // Circles
      for (const circle of circles) {
        // If exactly the same as a red circle
        if (
          circle.redRadius != null &&
          circle.city.latitude === city.latitude &&
          circle.city.longitude === city.longitude
        )
          return false;

        // Must be inside the green radius
        if (
          circle.greenRadius > 0 &&
          !isPointWithinRadius(
            city.latitude,
            city.longitude,
            circle.city.latitude,
            circle.city.longitude,
            circle.greenRadius,
          )
        )
          return false;

        // Must not be inside a red radius that takes precedence
        if (
          circle.redRadius != null &&
          isPointWithinRadius(
            city.latitude,
            city.longitude,
            circle.city.latitude,
            circle.city.longitude,
            circle.redRadius,
          ) &&
          (circle.redRadius < circle.greenRadius ||
            !isPointWithinRadius(
              city.latitude,
              city.longitude,
              circle.city.latitude,
              circle.city.longitude,
              circle.greenRadius,
            ))
        )
          return false;
      }

      return true;
    });
  }, [
    circles,
    showPossibleCitiesOnly,
    excludedCountries,
    countries,
    cities,
    hemisphere,
    continent,
    countriesData,
    usState,
    closestGuess,
    useClosestGuess,
    excludedUsStates,
  ]);

  const cityData = useMemo(
    () => createCityData(loadingState ? [] : visibleCities),
    [loadingState, visibleCities],
  );

  const circleData = useMemo(() => createCircleData(circles), [circles]);

  const equatorData = useMemo<GeoJSON.FeatureCollection<GeoJSON.LineString>>(
    () =>
      equatorialLine
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [-180, 0],
                    [180, 0],
                  ],
                },
              },
            ],
          }
        : { type: 'FeatureCollection', features: [] },
    [equatorialLine],
  );

  return {
    cityData,
    circleData,
    equatorData,
    visibleCities,
    countriesData,
    citiesLoading,
    countriesLoading,
  };
}
