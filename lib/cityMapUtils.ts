import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import type { CircleConfig, City } from '@/types';
import type { GeoJSON } from 'geojson';

export const CITY_SOURCE_ID = 'cities';
export const CIRCLE_SOURCE_ID = 'distance-circles';
export const EQUATOR_SOURCE_ID = 'equator';

export const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export function getGeoJSONSource(map: maplibregl.Map, sourceId: string) {
  return map.getSource(sourceId) as GeoJSONSource | undefined;
}

// GeoJSON builders

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

export function createCircleData(
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

  return { type: 'FeatureCollection', features };
}

export function createCityData(
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

// Layers

const COLOR_MATCH_EXPR = [
  'match',
  ['get', 'color'],
  'green',
  '#008000',
  'red',
  '#ff0000',
  '#000000',
] as maplibregl.ExpressionSpecification;

export function ensureLayers(map: maplibregl.Map) {
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
      paint: { 'fill-color': COLOR_MATCH_EXPR, 'fill-opacity': 0.2 },
    });
  }
  if (!map.getLayer('distance-circle-outline')) {
    map.addLayer({
      id: 'distance-circle-outline',
      type: 'line',
      source: CIRCLE_SOURCE_ID,
      paint: { 'line-color': COLOR_MATCH_EXPR, 'line-width': 2 },
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
      paint: { 'line-color': '#ff0000', 'line-width': 2 },
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
      paint: { 'text-color': '#111111' },
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
