export type City = {
  id: string;
  name: string;
  alternateNames: string;
  latitude: number;
  longitude: number;
  population: number;
  countryCode: string;
  admin1Name: string;
};

export type Country = {
  code: string;
  name: string;
};

export type CircleConfig = {
  city: City;
  redRadius: number | null;
  greenRadius: number;
};
