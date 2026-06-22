'use client';

import { useQuery } from '@tanstack/react-query';
import maplibregl, { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useMemo, useRef } from 'react';
import { createPopupHTML } from './Popup';
import type { CircleConfig, City, Country } from '@/types';
import {
  calculateDistance,
  fetchCities,
  isPointWithinRadius,
} from '@/lib/utils';
import type { GeoJSON } from 'geojson';

const CITY_SOURCE_ID = 'cities';
const CIRCLE_SOURCE_ID = 'distance-circles';
const EQUATOR_SOURCE_ID = 'equator';

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

function getGeoJSONSource(map: maplibregl.Map, sourceId: string) {
  return map.getSource(sourceId) as GeoJSONSource | undefined;
}

function createCirclePolygon(
  longitude: number,
  latitude: number,
  radiusKm: number,
  points = 96,
): GeoJSON.Position[] {
  const earthRadiusKm = 6371;
  const lat = (latitude * Math.PI) / 180;
  const lng = (longitude * Math.PI) / 180;
  const angularDistance = radiusKm / earthRadiusKm;
  const coordinates: GeoJSON.Position[] = [];

  for (let i = 0; i <= points; i++) {
    const bearing = (2 * Math.PI * i) / points;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(angularDistance) +
        Math.cos(lat) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const pointLng =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat),
        Math.cos(angularDistance) - Math.sin(lat) * Math.sin(pointLat),
      );

    coordinates.push([
      (((pointLng * 180) / Math.PI + 540) % 360) - 180,
      (pointLat * 180) / Math.PI,
    ]);
  }

  return coordinates;
}

function createCircleData(
  circles: CircleConfig[],
): GeoJSON.FeatureCollection<
  GeoJSON.Polygon,
  { color: 'green' | 'red'; id: string }
> {
  const features: GeoJSON.Feature<
    GeoJSON.Polygon,
    { color: 'green' | 'red'; id: string }
  >[] = [];

  for (const { city, redRadius, greenRadius } of circles) {
    if (greenRadius > 0) {
      features.push({
        type: 'Feature',
        properties: { color: 'green', id: `${city.id}-green-${greenRadius}` },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createCirclePolygon(city.longitude, city.latitude, greenRadius),
          ],
        },
      });
    }

    if (redRadius !== null) {
      features.push({
        type: 'Feature',
        properties: { color: 'red', id: `${city.id}-red-${redRadius}` },
        geometry: {
          type: 'Polygon',
          coordinates: [
            createCirclePolygon(city.longitude, city.latitude, redRadius),
          ],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

function createCityData(
  cities: City[],
): GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }> {
  return {
    type: 'FeatureCollection',
    features: cities
      .filter(
        (city) =>
          typeof city.latitude === 'number' &&
          typeof city.longitude === 'number',
      )
      .map((city) => ({
        type: 'Feature',
        properties: { id: city.id },
        geometry: {
          type: 'Point',
          coordinates: [city.longitude, city.latitude],
        },
      })),
  };
}

function ensureLayers(map: maplibregl.Map) {
  if (!map.getSource(CIRCLE_SOURCE_ID)) {
    map.addSource(CIRCLE_SOURCE_ID, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer('distance-circle-fill')) {
    map.addLayer({
      id: 'distance-circle-fill',
      type: 'fill',
      source: CIRCLE_SOURCE_ID,
      paint: {
        'fill-color': [
          'match',
          ['get', 'color'],
          'green',
          '#008000',
          'red',
          '#ff0000',
          '#000000',
        ],
        'fill-opacity': 0.2,
      },
    });
  }

  if (!map.getLayer('distance-circle-outline')) {
    map.addLayer({
      id: 'distance-circle-outline',
      type: 'line',
      source: CIRCLE_SOURCE_ID,
      paint: {
        'line-color': [
          'match',
          ['get', 'color'],
          'green',
          '#008000',
          'red',
          '#ff0000',
          '#000000',
        ],
        'line-width': 2,
      },
    });
  }

  if (!map.getSource(EQUATOR_SOURCE_ID)) {
    map.addSource(EQUATOR_SOURCE_ID, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
    });
  }

  if (!map.getLayer('equator-line')) {
    map.addLayer({
      id: 'equator-line',
      type: 'line',
      source: EQUATOR_SOURCE_ID,
      paint: {
        'line-color': '#ff0000',
        'line-width': 2,
      },
    });
  }

  if (!map.getSource(CITY_SOURCE_ID)) {
    map.addSource(CITY_SOURCE_ID, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
  }

  if (!map.getLayer('city-clusters')) {
    map.addLayer({
      id: 'city-clusters',
      type: 'circle',
      source: CITY_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1',
        ],
        'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 750, 30],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    });
  }

  if (!map.getLayer('cluster-count')) {
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: CITY_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#111111',
      },
    });
  }

  if (!map.getLayer('city-points')) {
    map.addLayer({
      id: 'city-points',
      type: 'circle',
      source: CITY_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#2f7ed8',
        'circle-radius': 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });
  }
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
  useCache,
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
  useCache: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const cityByIdRef = useRef<Map<string, City>>(new Map());
  const countriesRef = useRef<Country[]>([]);
  const distanceBracketsRef = useRef(distanceBrackets);
  const useClosestGuessRef = useRef(useClosestGuess);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const activeCityRef = useRef<City | null>(null);
  const cityDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );
  const circleDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );
  const equatorDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['cities', minPopulation, useCache],
    queryFn: async () => fetchCities(minPopulation, useCache),
    refetchOnWindowFocus: false,
  });

  const { data: countriesData = [], isLoading: countriesLoading } = useQuery<
    Country[]
  >({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/countries`,
      );
      if (!res.ok) throw new Error('Failed to load countries');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const visibleCities = useMemo(() => {
    if (!showPossibleCitiesOnly) {
      return cities;
    }

    const filteredCities =
      !countries || countries === 'all'
        ? cities
        : cities.filter((city) => city.countryCode === countries);

    const usedCityIds = new Set(circles.map((c) => c.city.id));

    return filteredCities.filter((city) => {
      if (usState && city.countryCode === 'US' && city.admin1 !== usState)
        return false;
      if (
        city.countryCode === 'US' &&
        city.admin1 &&
        excludedUsStates.includes(city.admin1)
      )
        return false;

      if (
        continent &&
        countriesData.find((country) => country.code === city.countryCode)
          ?.continent !== continent
      )
        return false;

      if (city.latitude < 0 && hemisphere === 'Northern Hemisphere')
        return false;
      if (city.latitude > 0 && hemisphere === 'Southern Hemisphere')
        return false;

      if (
        excludedCountries.some((country) => country.code === city.countryCode)
      )
        return false;

      if (
        city.name.toLowerCase().includes('estate') ||
        city.alternateNames
          .split(';')
          .some((s) => s.toLowerCase().includes('estate'))
      )
        return false;

      if (circles.length === 0) return true;

      if (usedCityIds.has(city.id)) return false;

      if (useClosestGuess && closestGuess) {
        const distanceToClosestGuess = calculateDistance(
          city.latitude,
          city.longitude,
          closestGuess.latitude,
          closestGuess.longitude,
        );

        for (const circle of circles) {
          const distanceToCircle = calculateDistance(
            city.latitude,
            city.longitude,
            circle.city.latitude,
            circle.city.longitude,
          );

          if (distanceToCircle < distanceToClosestGuess) {
            return false;
          }
        }
      }

      for (const circle of circles) {
        if (
          circle.redRadius != null &&
          circle.city.latitude === city.latitude &&
          circle.city.longitude === city.longitude
        )
          return false;

        if (
          circle.greenRadius > 0 &&
          !isPointWithinRadius(
            city.latitude,
            city.longitude,
            circle.city.latitude,
            circle.city.longitude,
            circle.greenRadius,
          )
        ) {
          return false;
        }

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
        ) {
          return false;
        }
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

  useEffect(() => {
    cityByIdRef.current = new Map(visibleCities.map((city) => [city.id, city]));
  }, [visibleCities]);

  useEffect(() => {
    countriesRef.current = countriesData;
  }, [countriesData]);

  useEffect(() => {
    distanceBracketsRef.current = distanceBrackets;
    if (activePopupRef.current && activeCityRef.current) {
      activePopupRef.current.setHTML(
        createPopupHTML(
          activeCityRef.current,
          countriesRef.current,
          distanceBrackets,
          useClosestGuessRef.current,
        ),
      );
    }
  }, [distanceBrackets]);

  useEffect(() => {
    useClosestGuessRef.current = useClosestGuess;
    if (activePopupRef.current && activeCityRef.current) {
      activePopupRef.current.setHTML(
        createPopupHTML(
          activeCityRef.current,
          countriesRef.current,
          distanceBracketsRef.current,
          useClosestGuess,
        ),
      );
    }
  }, [useClosestGuess]);

  useEffect(() => {
    cityDataRef.current = cityData;
    const map = mapRef.current;
    if (!map) return;
    getGeoJSONSource(map, CITY_SOURCE_ID)?.setData(cityData);
  }, [cityData]);

  useEffect(() => {
    circleDataRef.current = circleData;
    const map = mapRef.current;
    if (!map) return;
    getGeoJSONSource(map, CIRCLE_SOURCE_ID)?.setData(circleData);
  }, [circleData]);

  useEffect(() => {
    equatorDataRef.current = equatorData;
    const map = mapRef.current;
    if (!map) return;
    getGeoJSONSource(map, EQUATOR_SOURCE_ID)?.setData(equatorData);
  }, [equatorData]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [139.6917, 35.6895],
      zoom: 5,
      style: 'https://tiles.openfreemap.org/styles/liberty',
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-left');

    const handleLoad = () => {
      ensureLayers(map);
      getGeoJSONSource(map, CITY_SOURCE_ID)?.setData(cityDataRef.current);
      getGeoJSONSource(map, CIRCLE_SOURCE_ID)?.setData(circleDataRef.current);
      getGeoJSONSource(map, EQUATOR_SOURCE_ID)?.setData(equatorDataRef.current);
    };

    const handleClusterClick = async (event: MapLayerMouseEvent) => {
      const feature = map.queryRenderedFeatures(event.point, {
        layers: ['city-clusters'],
      })[0];
      const clusterId = feature?.properties?.cluster_id;
      if (typeof clusterId !== 'number') return;

      const source = getGeoJSONSource(map, CITY_SOURCE_ID);
      const zoom = await source?.getClusterExpansionZoom(clusterId);
      if (zoom == null) return;

      map.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ],
        zoom,
      });
    };

    const handleCityClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const cityId = feature?.properties?.id;
      if (typeof cityId !== 'string') return;

      const city = cityByIdRef.current.get(cityId);
      if (!city) return;

      const popup = new maplibregl.Popup({ offset: 14, maxWidth: 'none' })
        .setLngLat([city.longitude, city.latitude])
        .setHTML(
          createPopupHTML(
            city,
            countriesRef.current,
            distanceBracketsRef.current,
            useClosestGuessRef.current,
          ),
        )
        .addTo(map);

      activePopupRef.current = popup;
      activeCityRef.current = city;

      popup.on('close', () => {
        activePopupRef.current = null;
        activeCityRef.current = null;
      });
    };

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const clearCursor = () => {
      map.getCanvas().style.cursor = '';
    };

    const handleCenterMap = (event: Event) => {
      const { lat, lng } = (event as CustomEvent<{ lat: number; lng: number }>)
        .detail;
      map.easeTo({ center: [lng, lat], zoom: 10 });
    };

    map.on('load', handleLoad);
    map.on('click', 'city-clusters', handleClusterClick);
    map.on('click', 'city-points', handleCityClick);
    map.on('mouseenter', 'city-clusters', setPointerCursor);
    map.on('mouseenter', 'city-points', setPointerCursor);
    map.on('mouseleave', 'city-clusters', clearCursor);
    map.on('mouseleave', 'city-points', clearCursor);
    window.addEventListener('centerMap', handleCenterMap);

    return () => {
      window.removeEventListener('centerMap', handleCenterMap);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {(citiesLoading || countriesLoading || loadingState) && (
        <div className="absolute bottom-4 left-4 bg-background text-foreground px-3 py-1 rounded z-999">
          Loading cities...
        </div>
      )}
    </div>
  );
}
