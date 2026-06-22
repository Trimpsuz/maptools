import maplibregl, { MapLayerMouseEvent } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { GeoJSON } from 'geojson';
import type { City, Country } from '@/types';
import { createPopupHTML } from '../components/Popup';
import {
  CITY_SOURCE_ID,
  CIRCLE_SOURCE_ID,
  EQUATOR_SOURCE_ID,
  EMPTY_FEATURE_COLLECTION,
  ensureLayers,
  getGeoJSONSource,
} from '../lib/cityMapUtils';

interface UseMapInstanceProps {
  cityData: GeoJSON.FeatureCollection;
  circleData: GeoJSON.FeatureCollection;
  equatorData: GeoJSON.FeatureCollection;
  visibleCities: City[];
  countriesData: Country[];
  distanceBrackets: number[];
  useClosestGuess: boolean;
}

export function useMapInstance({
  cityData,
  circleData,
  equatorData,
  visibleCities,
  countriesData,
  distanceBrackets,
  useClosestGuess,
}: UseMapInstanceProps) {
  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Stable data refs
  const cityByIdRef = useRef<Map<string, City>>(new Map());
  const countriesRef = useRef<Country[]>([]);
  const distanceBracketsRef = useRef(distanceBrackets);
  const useClosestGuessRef = useRef(useClosestGuess);

  // GeoJSON data refs (seed the map on first load)
  const cityDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );
  const circleDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );
  const equatorDataRef = useRef<GeoJSON.FeatureCollection>(
    EMPTY_FEATURE_COLLECTION,
  );

  // Active popup refs
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const activeCityRef = useRef<City | null>(null);

  function refreshActivePopup() {
    if (!activePopupRef.current || !activeCityRef.current) return;
    activePopupRef.current.setHTML(
      createPopupHTML(
        activeCityRef.current,
        countriesRef.current,
        distanceBracketsRef.current,
        useClosestGuessRef.current,
      ),
    );
  }

  // Sync data refs

  useEffect(() => {
    cityByIdRef.current = new Map(visibleCities.map((city) => [city.id, city]));
  }, [visibleCities]);

  useEffect(() => {
    countriesRef.current = countriesData;
  }, [countriesData]);

  useEffect(() => {
    distanceBracketsRef.current = distanceBrackets;
    refreshActivePopup();
  }, [distanceBrackets]);

  useEffect(() => {
    useClosestGuessRef.current = useClosestGuess;
    refreshActivePopup();
  }, [useClosestGuess]);

  // Sync GeoJSON

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

    // Handlers

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

      const zoom = await getGeoJSONSource(
        map,
        CITY_SOURCE_ID,
      )?.getClusterExpansionZoom(clusterId);
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
      const cityId = event.features?.[0]?.properties?.id;
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

  return { mapContainerRef };
}
