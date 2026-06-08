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
} from "../@types/search.js";

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


export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius = 3000
): Promise<Place[]> {
  const query = `
    [out:json][timeout:25];
    (
      nwr["amenity"="restaurant"](around:${radius},${latitude},${longitude});
      nwr["amenity"="cafe"](around:${radius},${latitude},${longitude});
      nwr["amenity"="fast_food"](around:${radius},${latitude},${longitude});
      nwr["amenity"="bar"](around:${radius},${latitude},${longitude});
      nwr["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
      nwr["amenity"="hospital"](around:${radius},${latitude},${longitude});
      nwr["amenity"="clinic"](around:${radius},${latitude},${longitude});
      nwr["amenity"="bank"](around:${radius},${latitude},${longitude});
      nwr["shop"="supermarket"](around:${radius},${latitude},${longitude});
      nwr["shop"="convenience"](around:${radius},${latitude},${longitude});
      nwr["shop"="mall"](around:${radius},${latitude},${longitude});
      nwr["shop"="clothes"](around:${radius},${latitude},${longitude});
      nwr["shop"="bakery"](around:${radius},${latitude},${longitude});
      nwr["tourism"="attraction"](around:${radius},${latitude},${longitude});
      nwr["leisure"="park"](around:${radius},${latitude},${longitude});
      nwr["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
      nwr["amenity"="school"](around:${radius},${latitude},${longitude});
      nwr["amenity"="university"](around:${radius},${latitude},${longitude});
      nwr["amenity"="police"](around:${radius},${latitude},${longitude});
      nwr["amenity"="fuel"](around:${radius},${latitude},${longitude});
      nwr["shop"="beauty"](around:${radius},${latitude},${longitude});
      nwr["shop"="hairdresser"](around:${radius},${latitude},${longitude});
      nwr["shop"="electronics"](around:${radius},${latitude},${longitude});
      nwr["shop"="hardware"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "MyLocalGuideApp/1.0",
    },
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

// --- Fallback 1: Geocoding (Nominatim OpenStreetMap) ---
export async function getCoordinatesFallback(city: string): Promise<Coordinates> {
  const query = encodeURIComponent(city.trim());
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    {
      headers: {
        "User-Agent": "MyLocalGuideApp/1.0",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Cidade não encontrada no Nominatim.");
  }

  const lat = parseFloat(data[0].lat);
  const lon = parseFloat(data[0].lon);

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error("Coordenadas inválidas recebidas do Nominatim.");
  }

  return { latitude: lat, longitude: lon };
}

// --- Fallback 2: Weather (wttr.in) ---
export async function getWeatherFallback(latitude: number, longitude: number): Promise<WeatherData> {
  // format=j1 retorna JSON. lang=pt tenta trazer descrições em português.
  const response = await fetch(`https://wttr.in/${latitude},${longitude}?format=j1&lang=pt`);

  if (!response.ok) {
    throw new Error(`wttr.in error: ${response.status}`);
  }

  const data = await response.json();

  const current = data.current_condition?.[0];
  const today = data.weather?.[0];

  if (!current || !today) {
    throw new Error("Dados de clima inválidos no wttr.in.");
  }

  // Tenta pegar a descrição em PT, senão cai pro inglês padrão
  const conditionText = current.lang_pt?.[0]?.value || current.weatherDesc?.[0]?.value || "Clima variável";

  return {
    temperature: Math.round(Number(current.temp_C)),
    max: Math.round(Number(today.maxtempC)),
    min: Math.round(Number(today.mintempC)),
    condition: conditionText,
  };
}

// --- 5. Orquestra tudo: CEP → endereço → coordenadas → clima + locais ---
export async function searchRegion(cep: string): Promise<SearchResult> {
  const address = await getAddressByCep(cep);
  
  let coordinates;
  try {
    coordinates = await getCoordinates(address.localidade);
  } catch (error) {
    console.warn("Erro no Open-Meteo Geocoding (possível 429), tentando Nominatim...");
    try {
      coordinates = await getCoordinatesFallback(address.localidade);
    } catch (fallbackError) {
      console.warn("Ambas as APIs de geocoding falharam:", fallbackError);
      return {
        address,
        weather: { temperature: 0, max: 0, min: 0, condition: "Indisponível" },
        places: []
      };
    }
  }

  const [weather, places] = await Promise.all([
    getWeather(coordinates.latitude, coordinates.longitude).catch(
      async (error) => {
        console.warn("Erro no Open-Meteo Weather (possível 429), tentando wttr.in...");
        return getWeatherFallback(coordinates.latitude, coordinates.longitude).catch((fallbackError) => {
          console.warn("Ambas as APIs de clima falharam:", fallbackError);
          return {
            temperature: 0,
            max: 0,
            min: 0,
            condition: "Indisponível",
          };
        });
      }
    ),
    getNearbyPlaces(coordinates.latitude, coordinates.longitude).catch(
      (error) => {
        console.warn("Erro ao buscar locais próximos:", error);
        return [];
      }
    ),
  ]);

  return { address, weather, places };
}
