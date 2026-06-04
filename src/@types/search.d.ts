export interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface WeatherData {
  temperature: number;
  max: number;
  min: number;
  condition: string;
}

export interface WeatherResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

export interface Place {
  id: number;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  hours: string;
}

export interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    opening_hours?: string;
    ["addr:street"]?: string;
    ["addr:housenumber"]?: string;
    ["addr:city"]?: string;
  };
}

export interface SearchResult {
  address: AddressData;
  weather: WeatherData;
  places: Place[];
}
