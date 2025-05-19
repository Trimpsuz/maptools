export type City = {
  id: string;
  name: string;
  alternateNames: string;
  latitude: number;
  longitude: number;
  population: number;
  countryCode: string;
  admin1Name?: string;
  countryRequired?: boolean;
  admin1Required?: boolean;
  admin2Required?: boolean;
};

export type Country = {
  code: string;
  name: string;
  continent: string;
};

export type CircleConfig = {
  city: City;
  redRadius: number | null;
  greenRadius: number;
};

export type Continent = {
  geonameId: string;
  continent: string;
  name: string;
};

export type AddCityCircleEvent = CustomEvent<{
  id: string;
  redRadius: number;
  greenRadius: number;
}>;
