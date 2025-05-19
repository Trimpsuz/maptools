import { City, Country } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const radLat1 = toRadians(lat1);
  const radLon1 = toRadians(lon1);
  const radLat2 = toRadians(lat2);
  const radLon2 = toRadians(lon2);

  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = 6371;

  return radius * c;
}

export function isPointWithinRadius(pointLat: number, pointLon: number, centerLat: number, centerLon: number, radiusKm: number): boolean {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusKm;
}

export const findCity = (query: string, countries: Country[], cities: City[]) => {
  if (!query.trim()) {
    return 'Please enter a city name';
  }

  let cityName = '';
  let regionName = '';
  let countryCode = '';

  const parts = query.split(',').map((part) => part.trim());

  if (parts.length === 1) {
    cityName = parts[0];
  } else if (parts.length === 2) {
    cityName = parts[0];
    const countryInput = parts[1];

    if (countryInput.length === 2) {
      countryCode = countryInput.toUpperCase();
    } else {
      const country = countries.find((c) => c.name.toLowerCase() === countryInput.toLowerCase());
      if (country) {
        countryCode = country.code;
      } else {
        return 'Country not found';
      }
    }
  } else if (parts.length >= 3) {
    cityName = parts[0];
    regionName = parts[1];
    const countryInput = parts[2];

    if (countryInput.length === 2) {
      countryCode = countryInput.toUpperCase();
    } else {
      const country = countries.find((c) => c.name.toLowerCase() === countryInput.toLowerCase());
      if (country) {
        countryCode = country.code;
      } else {
        return 'Country not found';
      }
    }
  }

  let filteredCities = cities.filter((city) => city.name.split(', ')[0].toLowerCase() === cityName.toLowerCase());

  if (countryCode) {
    filteredCities = filteredCities.filter((city) => city.countryCode === countryCode);
  }

  if (regionName) {
    filteredCities = filteredCities.filter((city) => city.admin1Name?.toLowerCase().includes(regionName.toLowerCase()));
  }

  if (filteredCities.length === 0) {
    return 'City not found';
  }

  return filteredCities.sort((a, b) => b.population - a.population)[0];
};
