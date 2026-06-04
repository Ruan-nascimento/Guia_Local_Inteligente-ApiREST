import type {
  AddressData,
  ViaCepResponse,
  Coordinates,
  GeocodingResponse,
  WeatherData,
  WeatherResponse,
  Place,
  OverpassElement,
  SearchResult,
} from "../@types/search";

// --- Mapa de weather codes para texto em PT-BR ---
function getWeatherText(code: number): string {
  const map: Record<number, string> = {
    0: "Céu limpo",
    1: "Principalmente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Neblina",
    48: "Neblina",
    51: "Garoa leve",
    61: "Chuva leve",
    63: "Chuva moderada",
    80: "Pancadas de chuva",
  };
  return map[code] ?? "Clima variável";
}

// --- Mapa de categorias Overpass para PT-BR ---
function translateCategory(place: OverpassElement): string {
  const amenity = place.tags?.amenity;
  const shop = place.tags?.shop;
  const tourism = place.tags?.tourism;
  const leisure = place.tags?.leisure;

  const categories: Record<string, string> = {
    restaurant: "Restaurante",
    cafe: "Cafeteria",
    fast_food: "Lanchonete",
    bar: "Bar",
    pub: "Pub",
    pharmacy: "Farmácia",
    hospital: "Hospital",
    clinic: "Clínica",
    bank: "Banco",
    school: "Escola",
    university: "Universidade",
    supermarket: "Mercado",
    convenience: "Conveniência",
    mall: "Shopping",
    clothes: "Loja de roupas",
    bakery: "Padaria",
    attraction: "Turismo",
    park: "Parque",
    fitness_centre: "Academia",
    police: "Polícia",
    fuel: "Posto de combustível",
    beauty: "Beleza",
    hairdresser: "Barbearia / Cabeleireiro",
    electronics: "Eletrônicos",
    hardware: "Material de construção",
  };

  const key = amenity || shop || tourism || leisure || "local";
  return categories[key] || "Estabelecimento";
}

function getDescription(place: OverpassElement): string {
  const street = place.tags?.["addr:street"];
  const number = place.tags?.["addr:housenumber"];
  const city = place.tags?.["addr:city"];

  if (street && number && city) return `${street}, ${number} - ${city}`;
  if (street && number) return `${street}, ${number}`;
  if (street) return street;
  return "Local encontrado próximo à região pesquisada.";
}

// --- 1. Busca endereço pelo CEP (ViaCEP) ---
export async function getAddressByCep(cep: string): Promise<AddressData> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8 || !/^\d{8}$/.test(cleanCep)) {
    throw new Error("CEP inválido. Informe 8 dígitos numéricos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar CEP. Status: ${response.status}`);
  }

  const data: ViaCepResponse = await response.json();

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  if (!data.cep || !data.localidade || !data.uf) {
    throw new Error("Dados do endereço incompletos.");
  }

  return {
    cep: data.cep,
    logradouro: data.logradouro || "",
    bairro: data.bairro || "",
    localidade: data.localidade,
    uf: data.uf,
  };
}

// --- 2. Busca coordenadas pela cidade (Open-Meteo Geocoding) ---
export async function getCoordinates(city: string): Promise<Coordinates> {
  const trimmed = city.trim();

  if (!trimmed || trimmed.length < 2) {
    throw new Error("Nome da cidade inválido.");
  }

  const query = encodeURIComponent(trimmed);
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar coordenadas. Status: ${response.status}`);
  }

  const data: GeocodingResponse = await response.json();

  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw new Error("Cidade não encontrada.");
  }

  const result = data.results[0];

  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw new Error("Coordenadas inválidas recebidas.");
  }

  return { latitude: result.latitude, longitude: result.longitude };
}

// --- 3. Busca clima (Open-Meteo Weather) ---
export async function getWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar clima. Status: ${response.status}`);
  }

  const data: WeatherResponse = await response.json();

  const temperature = data.current?.temperature_2m;
  const weatherCode = data.current?.weather_code;
  const max = data.daily?.temperature_2m_max?.[0];
  const min = data.daily?.temperature_2m_min?.[0];

  if (
    typeof temperature !== "number" ||
    typeof weatherCode !== "number" ||
    typeof max !== "number" ||
    typeof min !== "number"
  ) {
    throw new Error("Dados de clima incompletos ou inválidos.");
  }

  return {
    temperature: Math.round(temperature),
    max: Math.round(max),
    min: Math.round(min),
    condition: getWeatherText(weatherCode),
  };
}

// --- 4. Busca locais próximos (Overpass API) ---
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius = 3000
): Promise<Place[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
      node["amenity"="cafe"](around:${radius},${latitude},${longitude});
      node["amenity"="fast_food"](around:${radius},${latitude},${longitude});
      node["amenity"="bar"](around:${radius},${latitude},${longitude});
      node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
      node["amenity"="hospital"](around:${radius},${latitude},${longitude});
      node["amenity"="clinic"](around:${radius},${latitude},${longitude});
      node["amenity"="bank"](around:${radius},${latitude},${longitude});
      node["shop"="supermarket"](around:${radius},${latitude},${longitude});
      node["shop"="convenience"](around:${radius},${latitude},${longitude});
      node["shop"="mall"](around:${radius},${latitude},${longitude});
      node["shop"="clothes"](around:${radius},${latitude},${longitude});
      node["shop"="bakery"](around:${radius},${latitude},${longitude});
      node["tourism"="attraction"](around:${radius},${latitude},${longitude});
      node["leisure"="park"](around:${radius},${latitude},${longitude});
      node["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
      node["amenity"="school"](around:${radius},${latitude},${longitude});
      node["amenity"="university"](around:${radius},${latitude},${longitude});
      node["amenity"="police"](around:${radius},${latitude},${longitude});
      node["amenity"="fuel"](around:${radius},${latitude},${longitude});
      node["shop"="beauty"](around:${radius},${latitude},${longitude});
      node["shop"="hairdresser"](around:${radius},${latitude},${longitude});
      node["shop"="electronics"](around:${radius},${latitude},${longitude});
      node["shop"="hardware"](around:${radius},${latitude},${longitude});
    );
    out body;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error("Não foi possível buscar estabelecimentos próximos.");
  }

  const data = await response.json();

  const places: Place[] = data.elements
    .filter((place: OverpassElement) => place.tags?.name)
    .map((place: OverpassElement) => ({
      id: place.id,
      name: place.tags?.name || "Nome não informado",
      category: translateCategory(place),
      description: getDescription(place),
      latitude: place.lat || place.center?.lat || latitude,
      longitude: place.lon || place.center?.lon || longitude,
      rating: null,
      hours: place.tags?.opening_hours || "Horário não informado",
    }));

  return places.slice(0, 12);
}

// --- 5. Orquestra tudo: CEP → endereço → coordenadas → clima + locais ---
export async function searchRegion(cep: string): Promise<SearchResult> {
  const address = await getAddressByCep(cep);
  const coordinates = await getCoordinates(address.localidade);

  const [weather, places] = await Promise.all([
    getWeather(coordinates.latitude, coordinates.longitude),
    getNearbyPlaces(coordinates.latitude, coordinates.longitude).catch(
      () => []
    ),
  ]);

  return { address, weather, places };
}
