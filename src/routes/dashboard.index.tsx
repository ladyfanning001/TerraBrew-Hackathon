import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db/db";
import { recommendationHistory } from "@/db/schema";
import {
  Droplets,
  Thermometer,
  CloudRain,
  CloudSun,
  Sun,
  Coffee,
  Leaf,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Award,
  Database,
  Gauge,
  Flame,
  Wind,
  Scale,
  FlaskConical,
  MapPin,
  Search,
  Navigation,
  Globe,
  Check,
  X,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getLiveCoffeePrice } from "@/lib/auth-server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

// Server function to write prediction results into PostgreSQL database
const saveRecommendationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      location: z.string(),
      rainfall: z.number(),
      water: z.number(),
      temperature: z.number(),
      humidity: z.number(),
      grade: z.string(),
      recommendedMethod: z.string(),
      score: z.number(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const result = await db
        .insert(recommendationHistory)
        .values({
          location: data.location,
          rainfall: data.rainfall,
          water: data.water,
          temperature: data.temperature,
          humidity: data.humidity,
          grade: data.grade,
          recommendedMethod: data.recommendedMethod,
          score: data.score,
        })
        .returning();
      return { success: true, record: result[0] };
    } catch (e: any) {
      console.error("Database insert error:", e);
      throw new Error(e.message || "Failed to save recommendation");
    }
  });

// Curated global coffee-growing presets (fallback and starting suggestions)
const GLOBAL_COFFEE_PRESETS = [
  { name: "Medellín, Antioquia (Colombia)", lat: "6.252", lng: "-75.564", elevation: "1495m" },
  { name: "Yirgacheffe, Sidamo (Ethiopia)", lat: "6.162", lng: "38.206", elevation: "1900m" },
  { name: "Nyeri Highlands (Kenya)", lat: "-0.417", lng: "36.950", elevation: "1750m" },
  { name: "Minas Gerais (Brazil)", lat: "-18.512", lng: "-44.555", elevation: "950m" },
  { name: "Huehuetenango (Guatemala)", lat: "15.314", lng: "-91.470", elevation: "1600m" },
  { name: "Tarrazú Valley (Costa Rica)", lat: "9.631", lng: "-84.026", elevation: "1500m" },
  { name: "Aceh Gayo (Indonesia)", lat: "4.690", lng: "96.850", elevation: "1400m" },
  { name: "Chiapas Highlands (Mexico)", lat: "16.750", lng: "-92.638", elevation: "1500m" },
];

// 5 Preprocessing methods database
const METHOD_DETAILS = {
  washed: {
    name: "Washed Process (Full Washed)",
    color: "#4682b4", // blue
    harvest: "Selective ripe cherries",
    depulping: "Yes (complete skin/mucilage removal)",
    fermentation: "Submerged wet fermentation, Aerobic",
    water: "Very high (5–40 L/kg cherry)",
    oxygen: "Aerobic",
    drying: "Sun patio or Mechanical dryer",
    moistureTarget: "10–12%",
    microbe: "LAB (Lactic Acid Bacteria) + Yeast",
    duration: "12–72 hours",
    waterLiters: 25,
    ecoScore: 55,
    // Chemistry
    ph: "5.1",
    acidity: "Medium",
    ester: "Low",
    alcohol: "Low",
    sugar: "Low",
    chlorogenic: "Relatively stable (High)",
    caffeine: "Normal",
    protein: "High",
    fat: "High",
    uniformity: "High (Stable final moisture content)",
    // Sensory
    flavor: "Clean cup, bright acidity, high clarity, light-medium body",
    environmentalRisk: "Very high wastewater output (Rich in organic matter)",
    dominantRisk: "Rewetting during drying, under-fermentation if rushed",
  },
  semi_washed: {
    name: "Semi Washed Process",
    color: "#27432b", // green
    harvest: "Selective hand-picked",
    depulping: "Partial (demucilaged mechanically)",
    fermentation: "Short soak / pile fermentation",
    water: "Medium (1–10 L/kg cherry)",
    oxygen: "Aerobic",
    drying: "Sun drying on concrete/beds",
    moistureTarget: "12%",
    microbe: "Native flora",
    duration: "24 hours",
    waterLiters: 6,
    ecoScore: 75,
    // Chemistry
    ph: "4.9",
    acidity: "Medium",
    ester: "Low-Medium",
    alcohol: "Low",
    sugar: "Low-Medium",
    chlorogenic: "Relatively stable",
    caffeine: "Normal",
    protein: "Medium-High",
    fat: "Medium-High",
    uniformity: "Medium-High",
    // Sensory
    flavor: "Balanced body, clean cup, mild acidity, herbal/spicy notes",
    environmentalRisk: "Medium waste (Produces acidic washwater)",
    dominantRisk: "Moderate drying risk, physical contamination during wet hulled",
  },
  honey: {
    name: "Honey Process",
    color: "#d88f34", // honey yellow
    harvest: "Selective ripe cherries",
    depulping: "Yes (mucilage deliberately retained)",
    fermentation: "Dry fermentation on mucilage, Aerobic",
    water: "Low-medium (0.5–5 L/kg cherry)",
    oxygen: "Aerobic",
    drying: "Raised beds with frequent turning",
    moistureTarget: "10–12%",
    microbe: "LAB (Lactic Acid Bacteria) + Yeast",
    duration: "12–48 hours",
    waterLiters: 2.5,
    ecoScore: 85,
    // Chemistry
    ph: "4.8",
    acidity: "High",
    ester: "Medium",
    alcohol: "Low",
    sugar: "Medium-High",
    chlorogenic: "Slightly decreased",
    caffeine: "Normal",
    protein: "Medium",
    fat: "Medium",
    uniformity: "Medium",
    // Sensory
    flavor: "High sweetness, fruity, full body, balanced citric acidity",
    environmentalRisk: "Low waste (Almost no washing wastewater)",
    dominantRisk: "Sticky drying → high mold risk if Relative Humidity >70%",
  },
  wine: {
    name: "Wine Process",
    color: "#b22222", // dark red
    harvest: "Selective premium ripe cherries",
    depulping: "No (whole cherry fermentation)",
    fermentation: "Extended cherry anaerobic fermentation",
    water: "Low (Almost waterless)",
    oxygen: "Mostly Anaerobic (closed tanks)",
    drying: "Whole cherry drying (raised beds)",
    moistureTarget: "10–12%",
    microbe: "Yeast dominant",
    duration: "5–30 days",
    waterLiters: 0.8,
    ecoScore: 90,
    // Chemistry
    ph: "4.3",
    acidity: "Very High",
    ester: "Very High (volatile esters dominate)",
    alcohol: "Very high (boozy/alcohol-like volatile)",
    sugar: "Very high",
    chlorogenic: "More decreased",
    caffeine: "Medium",
    protein: "Medium",
    fat: "Medium",
    uniformity: "Low (uneven moisture profile)",
    // Sensory
    flavor: "Winey, boozy, overripe fruit, fermented tropical notes, high complexity",
    environmentalRisk: "Very low waste (No water waste, organic solid residues only)",
    dominantRisk: "Over-acidification, vinegar defect, off-flavors if over-fermented",
  },
  natural: {
    name: "Natural Process",
    color: "#42302c", // coffee brown
    harvest: "Selective ripe cherries",
    depulping: "No (dried intact as whole cherries)",
    fermentation: "Cherry fermentation in skin, Aerobic",
    water: "Very low (<1 L/kg cherry)",
    oxygen: "Aerobic",
    drying: "Whole cherry drying on patios / beds",
    moistureTarget: "10–12%",
    microbe: "Native yeast",
    duration: "15–21 days",
    waterLiters: 0.5,
    ecoScore: 95,
    // Chemistry
    ph: "4.7",
    acidity: "High",
    ester: "High",
    alcohol: "Medium",
    sugar: "High (Highest natural sugar level)",
    chlorogenic: "More decreased",
    caffeine: "Lower",
    protein: "Lower",
    fat: "Lower",
    uniformity: "Low (Risk of non-uniform moisture)",
    // Sensory
    flavor: "Intense fruitiness, berry-like sweetness, heavy body, chocolatey undertones",
    environmentalRisk: "Very low waste (No water waste, dried skins composted)",
    dominantRisk: "Fungal growth, black bean defects if RH >70% during drying",
  },
};

function DashboardHome() {
  const [locationInput, setLocationInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>(GLOBAL_COFFEE_PRESETS);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    lat: string;
    lng: string;
    elevation: string;
  } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState<boolean | null>(null);

  // Environmental inputs states
  const [rainfall, setRainfall] = useState([35]);
  const [temperature, setTemperature] = useState([24]);
  const [humidity, setHumidity] = useState([78]);
  const [cloudCover, setCloudCover] = useState([40]);
  const [windSpeed, setWindSpeed] = useState([12]);

  // Farmer constraint states
  const [fermentationDuration, setFermentationDuration] = useState([24]);
  const [hasDepulper, setHasDepulper] = useState(true);

  // Coffee Grade input state (restored)
  const [grade, setGrade] = useState("A");

  // Batch weight state for waste calculation
  const [batchWeight, setBatchWeight] = useState<number>(1000);

  const [hasCalculated, setHasCalculated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced live global geocoding fetch from Open-Meteo Geocoding API
  useEffect(() => {
    if (!locationInput.trim()) {
      setSuggestions(GLOBAL_COFFEE_PRESETS);
      return;
    }

    // Check if input is coordinates directly (e.g. "latitude, longitude")
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;
    if (coordRegex.test(locationInput)) {
      setSuggestions([]); // Clear suggestions as it's a coordinate
      return;
    }

    if (locationInput.length < 2) return;

    setIsGeocoding(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          locationInput,
        )}&count=8&language=en&format=json`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.results) {
            const parsed = data.results.map((r: any) => ({
              name: `${r.name}${r.admin1 ? ", " + r.admin1 : ""} (${r.country})`,
              lat: r.latitude.toFixed(3),
              lng: r.longitude.toFixed(3),
              elevation: r.elevation ? `${Math.round(r.elevation)}m` : "Unknown",
            }));
            setSuggestions(parsed);
          } else {
            setSuggestions([]);
          }
        })
        .catch((err) => {
          console.error("Geocoding fetch failed, falling back:", err);
        })
        .finally(() => {
          setIsGeocoding(false);
        });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [locationInput]);

  // Handle outside clicks to close search suggestions
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle preset selected from universal search in header
  useEffect(() => {
    const handlePresetSelect = () => {
      const stored = localStorage.getItem("weather_preset_select");
      if (stored) {
        try {
          const preset = JSON.parse(stored);
          setLocationInput(preset.name);
          fetchWeatherForCoords(preset.name, preset.lat, preset.lng, preset.elevation);
          localStorage.removeItem("weather_preset_select");
        } catch (e) {
          console.error("Failed to parse search weather preset:", e);
        }
      }
    };
    window.addEventListener("weather-preset-update", handlePresetSelect);
    handlePresetSelect();

    return () => {
      window.removeEventListener("weather-preset-update", handlePresetSelect);
    };
  }, []);

  // Fetch real-time weather from Open-Meteo API using coordinates
  const fetchWeatherForCoords = async (
    name: string,
    lat: string,
    lng: string,
    elevation: string,
  ) => {
    setIsLoading(true);
    setIsLocationConfirmed(null);

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,cloudcover,windspeed_10m`,
      );
      if (!response.ok) throw new Error("Failed to fetch weather data");

      const data = await response.json();
      const current = data.current;

      const temp = Math.round(current.temperature_2m);
      const hum = Math.round(current.relative_humidity_2m);
      const rain = current.rain > 0 ? Math.round(current.rain * 12 + 5) : 0;
      const clouds = current.cloudcover ?? 0;
      const wind = current.windspeed_10m ?? 0;

      setTemperature([temp]);
      setHumidity([hum]);
      setRainfall([rain]);
      setCloudCover([clouds]);
      setWindSpeed([wind]);

      setCoordinates({ lat, lng, elevation });
      setActiveLocation(name);

      // Update global header weather
      const weatherPayload = { name: name.split(",")[0].split(" (")[0], temp, humidity: hum };
      localStorage.setItem("current_location", JSON.stringify(weatherPayload));
      window.dispatchEvent(new Event("weather-update"));
    } catch (error) {
      console.error("Open-Meteo Fetch Error:", error);
      setTemperature([23]);
      setHumidity([60]);
      setRainfall([5]);
      setCloudCover([20]);
      setWindSpeed([10]);
      setActiveLocation(name);
      setCoordinates({ lat, lng, elevation });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (preset: {
    name: string;
    lat: string;
    lng: string;
    elevation: string;
  }) => {
    setLocationInput(preset.name);
    setShowSuggestions(false);
    fetchWeatherForCoords(preset.name, preset.lat, preset.lng, preset.elevation);
  };

  // Custom manual search submit or coordinates submit
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;

    // Check if input is a direct coordinate: "latitude, longitude"
    const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;
    const match = locationInput.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]).toFixed(3);
      const lng = parseFloat(match[3]).toFixed(3);
      setShowSuggestions(false);
      fetchWeatherForCoords(`Coordinate Pin (${lat}, ${lng})`, lat, lng, "Sensor Level");
      return;
    }

    if (suggestions.length > 0) {
      handleSelectLocation(suggestions[0]);
    }
  };

  // Agronomical recommendation scoring logic based on environmental and crop grade variables
  // Agronomical recommendation scoring logic based on environmental and crop grade variables (PDF Tables 1, 2, 7)
  const scores = useMemo(() => {
    const r = rainfall[0];
    const t = temperature[0];
    const h = humidity[0];
    const c = cloudCover[0];
    const wS = windSpeed[0];
    const fd = fermentationDuration[0];

    // Auto-infer water availability based on rainfall and humidity
    const w = Math.min(100, Math.max(10, 100 - h * 0.4 + r * 1.5));

    // 1. WASHED
    // Air melimpah (w > 75), Musim hujan + air banyak, Curah hujan tinggi + RH tinggi
    let washed = 30;
    if (!hasDepulper) washed -= 100; // Impossible
    if (w > 75) washed += 35;
    if (w < 30) washed -= 50; // Hampir tidak mungkin jika air sangat terbatas
    if (r > 20 && h > 65) washed += 25; // Risiko jamur lebih rendah
    if (fd > 72) washed -= 40; // Washed shouldn't ferment this long

    // 2. SEMI WASHED
    // Air cukup (w > 40), Curah hujan tinggi + RH tinggi
    let semiWashed = 35;
    if (!hasDepulper) semiWashed -= 100; // Impossible
    if (w > 40 && w <= 75) semiWashed += 25;
    if (w > 75) semiWashed += 15; // Bisa dilakukan tapi airnya berlebih
    if (w < 20) semiWashed -= 30;
    if (r > 20 && h > 65) semiWashed += 20;

    // 3. HONEY
    // Air terbatas (w > 15 && w < 50), RH sedang + suhu stabil (h 50-60, t 20-30), Cuaca kering (r < 10)
    let honey = 30;
    if (!hasDepulper) honey -= 100; // Impossible
    if (w > 15 && w < 50) honey += 25; // Hemat air
    if (w < 15) honey -= 10; // Butuh sedikit air untuk pulping
    if (h >= 50 && h <= 65 && t >= 20 && t <= 30) honey += 25; // Risiko moderat
    if (r < 15) honey += 10; // Musim kemarau mengurangi penggunaan air
    if (h > 70) honey -= 30; // Sticky mucilage mudah jamur

    // 4. WINE PROCESS / ANAEROBIC
    // Cuaca tidak stabil, Air rendah
    let wine = 25;
    if (w < 40) wine += 15;
    if (grade === "A") wine += 30; // Butuh selective premium
    if (grade === "C") wine -= 50;
    if (h > 70) wine += 10; // Cenderung aman dari jamur awal karena anaerob
    if (t > 30) wine -= 25; // Suhu tinggi merusak mikroba fermentasi
    if (fd > 72) wine += 40; // Needs extended duration

    // 5. NATURAL
    // Air sangat terbatas (w < 25), Cuaca kering & panas stabil (h < 60, r < 15, t 25-35)
    let natural = 30;
    if (w < 25) natural += 40; // Hampir tidak membutuhkan air
    if (w > 60) natural -= 10; // Sayang kalau air banyak malah natural
    if (h < 60 && r < 15) natural += 30; // Cocok untuk fruit-on drying
    if (h > 70 || r > 20) natural -= 50; // Sangat bahaya mold growth & black bean
    if (c > 60) natural -= 20; // Needs sun
    if (wS > 20) natural += 15; // Wind helps drying

    const clamp = (val: number) => Math.max(0, Math.min(100, val));

    return {
      washed: clamp(washed),
      semi_washed: clamp(semiWashed),
      honey: clamp(honey),
      wine: clamp(wine),
      natural: clamp(natural),
    };
  }, [
    rainfall,
    temperature,
    humidity,
    grade,
    cloudCover,
    windSpeed,
    fermentationDuration,
    hasDepulper,
  ]);

  // Determine top pick key
  const topKey = useMemo(() => {
    const arr = Object.entries(scores) as [keyof typeof scores, number][];
    arr.sort((a, b) => b[1] - a[1]);
    return arr[0][0];
  }, [scores]);

  const recommendedData = METHOD_DETAILS[topKey];

  // Output Quality Prediction (PDF Table 6 & Expanded Chemistry Targets)
  const outputPrediction = useMemo(() => {
    const h = humidity[0];
    const r = rainfall[0];
    const temp = temperature[0];
    const fd = fermentationDuration[0];
    const selected = topKey;

    if (temp > 45) return "Thermal damage (Aroma flattening, roasted defect, low acidity)";
    if (h > 70) return "Risk of mold & acidity defect (High BOD/COD in wastewater)";
    if (fd > 96 && selected !== "wine")
      return "Over-fermentation risk (Vinegar defect, off-flavors)";

    if (temp >= 20 && temp <= 30 && h >= 50 && h <= 55)
      return "High specialty potential (Stable metabolites)";
    if (selected === "natural" && h < 60 && r < 15)
      return "High fruity sweetness (Intense fruitiness)";
    if (selected === "honey" && h >= 50 && h <= 65) return "Increased body & sweetness";

    return "Standard flavor profile based on process type";
  }, [humidity, temperature, rainfall, topKey, fermentationDuration]);

  const processComparisons = useMemo(() => {
    const h = humidity[0];
    const r = rainfall[0];
    const temp = temperature[0];
    const w = Math.min(100, Math.max(10, 100 - h * 0.4 + r * 1.5));

    return Object.entries(METHOD_DETAILS).map(([key, meta]) => {
      let feasibility = "Safe";
      let feasibilityClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      let logic = "Suitable for current environment.";
      let leaves = "🌿";

      if (key === "washed") {
        leaves = "🌿";
        if (w < 30) {
          feasibility = "Not Recommended";
          feasibilityClass = "bg-rose-500/10 text-rose-700 border-rose-500/20";
          logic = "Extremely high water demand. Insufficient local water resource.";
        } else if (r > 20 && h > 65) {
          feasibility = "Best Choice";
          feasibilityClass =
            "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-extrabold";
          logic = "Wet environment protects process from drying mold contamination.";
        } else {
          feasibility = "Feasible";
          feasibilityClass = "bg-amber-500/10 text-amber-700 border-amber-500/20";
          logic = "Feasible but consumes excessive water resources.";
        }
      } else if (key === "semi_washed") {
        leaves = "🌿🌿🌿";
        if (w < 20) {
          feasibility = "Not Recommended";
          feasibilityClass = "bg-rose-500/10 text-rose-700 border-rose-500/20";
          logic = "Insufficient water availability even for semi-washed process.";
        } else {
          feasibility = "Recommended";
          feasibilityClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
          logic = "Balanced water usage and well-suited for humid climates.";
        }
      } else if (key === "honey") {
        leaves = "🌿🌿🌿🌿";
        if (h > 70) {
          feasibility = "Risky";
          feasibilityClass = "bg-rose-500/10 text-rose-700 border-rose-500/20";
          logic = "High relative humidity (>70%) makes sticky mucilage prone to fungal rot.";
        } else {
          feasibility = "Recommended";
          feasibilityClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
          logic = "Saves water. Stable relative humidity allows safe drying of mucilage.";
        }
      } else if (key === "wine") {
        leaves = "🌿🌿🌿🌿🌿";
        if (temp > 30) {
          feasibility = "Risky";
          feasibilityClass = "bg-amber-500/10 text-amber-700 border-amber-500/20";
          logic = "High temperatures (>30°C) degrade anaerobic fermentation microbes.";
        } else {
          feasibility = "Recommended";
          feasibilityClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
          logic = "Controlled anaerobic fermentation prevents ambient mold defects.";
        }
      } else if (key === "natural") {
        leaves = "🌿🌿🌿🌿🌿";
        if (h > 70 || r > 15) {
          feasibility = "Critical Risk";
          feasibilityClass = "bg-rose-500/10 text-rose-700 border-rose-500/20 font-extrabold";
          logic = "Rain or high humidity (>70%) triggers heavy mold & black bean defects.";
        } else {
          feasibility = "Highly Recommended";
          feasibilityClass =
            "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 font-extrabold";
          logic = "Zero-water process. Dry, low-humidity conditions promote fast sun-drying.";
        }
      }

      return {
        key,
        name: meta.name.split(" (")[0],
        color: meta.color,
        waterLiters: meta.waterLiters,
        ecoScore: meta.ecoScore,
        feasibility,
        feasibilityClass,
        logic,
        leaves,
      };
    });
  }, [humidity, rainfall, temperature]);

  // Recharts Charting Data
  const radarData = useMemo(() => {
    return [
      { parameter: "Washed", Score: scores.washed },
      { parameter: "Semi-Washed", Score: scores.semi_washed },
      { parameter: "Honey", Score: scores.honey },
      { parameter: "Wine", Score: scores.wine },
      { parameter: "Natural", Score: scores.natural },
    ];
  }, [scores]);

  const waterChartData = useMemo(() => {
    return [
      { name: "Washed", Liters: 25, color: "#4682b4" },
      { name: "Semi-Washed", Liters: 6, color: "#27432b" },
      { name: "Honey", Liters: 2.5, color: "#d88f34" },
      { name: "Wine", Liters: 0.8, color: "#b22222" },
      { name: "Natural", Liters: 0.5, color: "#42302c" },
    ];
  }, []);

  // Risk alert rules engine
  // Risk alert rules engine (Table 5: Monitoring Resiko)
  const alerts = useMemo(() => {
    const alertList = [];
    const h = humidity[0];
    const r = rainfall[0];
    const temp = temperature[0];
    const c = cloudCover[0];
    const fd = fermentationDuration[0];

    if (h > 70) {
      alertList.push({
        level: "danger",
        title: "Mold growth risk",
        desc: `RH >70% detected (${h}%). High risk of fungal growth. Solution: Increase ventilation.`,
      });
    }

    if (r > 15) {
      alertList.push({
        level: "warning",
        title: "Rewetting risk",
        desc: `Rainfall detected (${r} mm/day). Risk of mold & rotten beans. Solution: Close dryer.`,
      });
    }

    if (temp > 35) {
      alertList.push({
        level: "danger",
        title: "Overdrying / Thermal damage",
        desc: `Temp >35°C detected (${temp}°C). High risk of aroma flattening and roasted defects. Solution: Lower temperature.`,
      });
    }

    if (c > 75) {
      alertList.push({
        level: "warning",
        title: "Low Solar Radiation",
        desc: `Cloud cover at ${c}%. Solar drying will be extremely slow. Consider mechanical drying if humidity is also high.`,
      });
    }

    if (fd > 72 && topKey !== "wine") {
      alertList.push({
        level: "danger",
        title: "Over-fermentation Risk",
        desc: `Duration ${fd}h is too long for standard processing. Stop fermentation immediately or risk vinegar defects.`,
      });
    }

    // Default if all good
    if (alertList.length === 0) {
      alertList.push({
        level: "info",
        title: "Conditions Optimal",
        desc: "Environmental parameters and constraints are stable. Continue monitoring.",
      });
    }

    return alertList;
  }, [humidity, rainfall, temperature, cloudCover, fermentationDuration, topKey]);

  // Drying Decision Actions (Table 3: Drying System)
  const dryingAction = useMemo(() => {
    const h = humidity[0];
    const temp = temperature[0];
    const r = rainfall[0];
    const wS = windSpeed[0];

    if (r > 15) return { status: "Rewetting risk", action: "Close solar dryer" };
    if (h > 70) {
      if (wS > 15)
        return {
          status: "High risk (Mitigated by Wind)",
          action: "Continue natural ventilation, monitor RH",
        };
      return { status: "High risk", action: "Close dryer / activate mechanical ventilation" };
    }
    if (temp > 35) return { status: "Overheating risk", action: "Reduce hot airflow" };
    if (temp >= 20 && temp <= 35 && h >= 50 && h <= 55)
      return { status: "Optimal", action: "Continue drying" };

    return { status: "Monitoring Needed", action: "Continue parameter monitoring" };
  }, [humidity, temperature, rainfall, windSpeed]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 text-foreground bg-background">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "4s" }} />{" "}
          TerraBrew smart engine
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl text-primary">
          Smart Post-Harvest Predictor
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sync real-time weather by entering location names, raw coordinates (e.g. `6.25, -75.56`),
          or manually adjusting variables.
        </p>
      </div>
      {/* INPUTS FORM CARD */}
      <Card className="rounded-2xl border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden">
        <CardHeader className="bg-secondary/20 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-primary font-bold text-lg">
            <Coffee className="h-5 w-5 text-accent" />
            Preprocessing Environment Form
          </CardTitle>
          <CardDescription>
            Enter values manually or sync them automatically by searching global locations or direct
            coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* STEP 1: Location Sync & Batch Setup */}
          <div className="space-y-4 pb-6 border-b border-border/60">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Global search */}
              <div className="md:col-span-2 flex flex-col gap-2 relative" ref={searchContainerRef}>
                <Label htmlFor="location-search" className="text-xs font-bold text-foreground">
                  📍 Global Weather Search (Geocoding API / Coordinate Input)
                </Label>
                <form onSubmit={handleManualSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location-search"
                      placeholder="Enter city name OR coordinates 'lat, lng' (e.g. -8.24, 115.33)"
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="pl-9 border-border bg-secondary/30 focus-visible:bg-background text-xs"
                    />
                    {isGeocoding && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-accent animate-pulse font-semibold">
                        Searching...
                      </span>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-forest text-cream hover:bg-forest-deep text-xs font-bold px-4"
                  >
                    <Search className="h-4 w-4 mr-1.5" />
                    {isLoading ? "Syncing..." : "Sync Weather"}
                  </Button>
                </form>

                {/* Autocomplete suggestions dropdown list */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto divide-y divide-border/60">
                    {suggestions.map((preset) => (
                      <button
                        key={preset.name + preset.lat + preset.lng}
                        type="button"
                        onClick={() => handleSelectLocation(preset)}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-secondary/40 transition-colors flex items-center justify-between"
                      >
                        <span className="font-bold text-foreground">{preset.name}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          Elev: {preset.elevation} | Coord: {preset.lat}, {preset.lng}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Batch setup at first */}
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="batch-weight-input-top"
                  className="text-xs font-bold text-foreground"
                >
                  📦 Batch Size / Harvest Weight (kg cherry)
                </Label>
                <div className="relative">
                  <Input
                    id="batch-weight-input-top"
                    type="number"
                    value={batchWeight}
                    onChange={(e) => setBatchWeight(Math.max(1, parseInt(e.target.value) || 0))}
                    className="border-border bg-secondary/30 focus-visible:bg-background text-xs font-bold pr-12 h-10 rounded-xl"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Weather Verification & Confirmation Component */}
            {activeLocation && (
              <div className="rounded-xl border border-border bg-secondary/10 p-4 space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex gap-3 items-center">
                    <div className="p-2.5 rounded-lg bg-forest/15 text-forest shrink-0">
                      <Globe className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Global Weather API Sync Verified
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Fetched coordinates:{" "}
                        <span className="font-bold text-foreground">
                          {coordinates?.lat}° N, {coordinates?.lng}° E
                        </span>{" "}
                        ({coordinates?.elevation} elevation)
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-forest/15 text-forest border-transparent py-1 self-start sm:self-auto"
                  >
                    🟢 Live Open-Meteo API OK
                  </Badge>
                </div>

                {/* Verification/Confirmation Checkbox */}
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Is the weather data for{" "}
                    <strong className="text-foreground">{activeLocation}</strong> below correct?
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsLocationConfirmed(true)}
                      className={`h-7 px-3 rounded-lg border text-xs font-bold transition ${
                        isLocationConfirmed === true
                          ? "bg-forest/15 border-forest text-forest hover:bg-forest/15"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Yes, Correct
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsLocationConfirmed(false);
                        // Reset weather variables to defaults
                        setRainfall([35]);
                        setTemperature([24]);
                        setHumidity([78]);
                        setActiveLocation(null);
                        setCoordinates(null);
                        setLocationInput("");
                      }}
                      className="h-7 px-3 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-bold"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Incorrect (Reset)
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Parameters Form Inputs */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <FormSliderRow
                icon={CloudRain}
                label="Rainfall"
                value={rainfall}
                onChange={setRainfall}
                max={150}
                unit="mm/day"
                description="Rainfall limits sun-drying efficiency and prompts wet processes."
              />
              <FormSliderRow
                icon={CloudSun}
                label="Cloud Cover"
                value={cloudCover}
                onChange={setCloudCover}
                max={100}
                unit="%"
                description="High cloud cover slows down solar drying drastically."
              />
              <FormSliderRow
                icon={Wind}
                label="Wind Speed"
                value={windSpeed}
                onChange={setWindSpeed}
                max={50}
                unit="km/h"
                description="High wind speed aids natural ventilation for raised beds."
              />
            </div>
            <div className="space-y-6">
              <FormSliderRow
                icon={Thermometer}
                label="Temperature"
                value={temperature}
                onChange={setTemperature}
                min={10}
                max={45}
                unit="°C"
                description="Drying temperatures outside 20–35°C risk defects or rot."
              />
              <FormSliderRow
                icon={Droplets}
                label="Relative Humidity (RH)"
                value={humidity}
                onChange={setHumidity}
                max={100}
                unit="%"
                description="High humidity (>70%) dramatically raises drying mold risks."
              />
            </div>
          </div>

          {/* STEP 3: Farmer Constraints & Targets */}
          <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-border/60">
            {/* Left Card: Fermentation Process */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col space-y-6">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Fermentation Process
              </h3>
              <div className="flex-1">
                <FormSliderRow
                  icon={FlaskConical}
                  label="Target Fermentation Duration"
                  value={fermentationDuration}
                  onChange={setFermentationDuration}
                  min={12}
                  max={120}
                  unit="hours"
                  description="Extended durations (>72h) favor Anaerobic/Wine processes."
                />
              </div>
            </div>

            {/* Right Card: Hardware & Quality */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col space-y-6">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-accent" />
                Farm Capabilities
              </h3>
              <div className="space-y-4 flex-1">
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40">
                  <Label className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    <Database className="h-4 w-4 text-accent" />
                    Available Equipment
                  </Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Depulper Machine</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHasDepulper(!hasDepulper)}
                      className={
                        hasDepulper
                          ? "bg-accent/15 text-accent border-accent hover:bg-accent/20"
                          : "bg-card text-muted-foreground"
                      }
                    >
                      {hasDepulper ? (
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      ) : (
                        <X className="h-4 w-4 mr-1.5" />
                      )}
                      {hasDepulper ? "Available" : "Unavailable"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    *Without a depulper, Washed and Honey processes are physically impossible.
                  </p>
                </div>

                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 space-y-3">
                  <Label className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Coffee className="h-4 w-4 text-coffee" />
                    Coffee Cherry Quality Grade
                  </Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="rounded-xl bg-background border-border text-xs focus:ring-accent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">
                        Grade A — Specialty Cherry (Perfect ripeness)
                      </SelectItem>
                      <SelectItem value="B">Grade B — Premium Grade Cherry</SelectItem>
                      <SelectItem value="C">Grade C — Commercial Grade Cherry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              size="lg"
              onClick={async () => {
                setHasCalculated(false);
                setIsGenerating(true);

                // Write prediction to PostgreSQL Database via Server Function
                try {
                  await saveRecommendationFn({
                    data: {
                      location: activeLocation || "Manual Input",
                      rainfall: rainfall[0],
                      temperature: temperature[0],
                      humidity: humidity[0],
                      water: 0,
                      grade: grade,
                      recommendedMethod: topKey,
                      score: scores[topKey],
                    },
                  });
                } catch (dbErr) {
                  console.error("Failed to log to PostgreSQL:", dbErr);
                }

                // Simulate processing latency for visual feedback
                setTimeout(() => {
                  setIsGenerating(false);
                  setHasCalculated(true);

                  // Scroll page smoothly to results
                  setTimeout(() => {
                    document
                      .getElementById("recommendation-results")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }, 1800);
              }}
              disabled={isGenerating}
              className="bg-coffee text-cream hover:bg-coffee-deep rounded-full font-bold px-8 shadow-md flex items-center gap-2 disabled:opacity-80"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-cream/20 border-t-cream rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" /> Generate Preprocessing Recommendation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LOADING STATE DISPLAY */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border/60 rounded-2xl shadow-soft space-y-4 animate-pulse">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-forest/10 border-t-forest animate-spin" />
            <Leaf className="absolute h-6 w-6 text-forest animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-base font-bold text-foreground">Processing Preprocessing Recommendation...</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto animate-bounce duration-1000">
              Modeling environmental variables, water footprint limits, and coffee cherry grade...
            </p>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY PANEL */}
      {hasCalculated && (
        <div id="recommendation-results" className="space-y-6 animate-fade-in">
          {/* Main Recommendation Details */}
          <Card className="rounded-2xl border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div
              className="flex flex-wrap items-center justify-between gap-4 p-6 text-cream"
              style={{ background: "var(--gradient-primary)" }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream/15 backdrop-blur shrink-0">
                  <Award className="h-6 w-6 text-cream" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-cream/70">
                    Recommended Preprocessing
                  </div>
                  <div className="text-xl font-bold tracking-tight text-cream">
                    {recommendedData.name}
                  </div>
                </div>
              </div>
              <Badge className="rounded-full bg-cream px-4 py-1.5 text-xs font-bold text-primary hover:bg-cream/90 shadow-sm border-transparent">
                Recommendation Score: {scores[topKey]}%
              </Badge>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Output Quality Prediction Banner */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-accent/20 bg-accent/5">
                <Sparkles className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">Output Quality Prediction</h4>
                  <p className="text-sm text-muted-foreground mt-1">{outputPrediction}</p>
                </div>
              </div>

              {/* Sustainability Milestone / Water Savings Banner */}
              {(() => {
                const washedWater = 25;
                const currentWater = recommendedData.waterLiters;
                const waterSavedPerKg = washedWater - currentWater;
                const totalWaterSaved = batchWeight * waterSavedPerKg;

                if (waterSavedPerKg > 0) {
                  return (
                    <div className="flex items-start gap-4 p-5 rounded-2xl border border-forest/20 bg-forest/5 shadow-soft transition-all duration-300 hover:shadow-card animate-fade-in-up animation-delay-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest shrink-0">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-forest flex items-center gap-1.5">
                          Eco-Friendly Process Option
                          <span className="inline-block animate-bounce">💧</span>
                        </h4>
                        <p className="text-sm text-foreground/90 leading-relaxed">
                          By selecting <span className="font-extrabold text-forest">{recommendedData.name}</span> instead of the conventional Washed method, you are saving approximately <span className="font-extrabold text-forest">{totalWaterSaved.toLocaleString()} Liters</span> of clean freshwater for this batch size of <span className="font-bold">{batchWeight.toLocaleString()} kg</span>! This is a significant contribution to protecting local aquifers and avoiding acidic wastewater runoffs.
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-start gap-4 p-5 rounded-2xl border border-honey/20 bg-honey/5 shadow-soft transition-all duration-300 hover:shadow-card animate-fade-in-up animation-delay-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-honey/10 text-honey shrink-0">
                        <Droplets className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-coffee">
                          Water Conservation Notice
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          This batch requires the conventional <span className="font-bold text-coffee">{recommendedData.name}</span> process to secure cup quality under current weather/risk factors, which will consume about <span className="font-bold text-coffee">{(batchWeight * recommendedData.waterLiters).toLocaleString()} Liters</span> of water. 
                          <span className="block mt-1 font-semibold text-xs text-forest">Tip: For future batches under dry and low-humidity weather conditions, you can pivot to Honey or Natural preprocessing to save up to {(batchWeight * 24.5).toLocaleString()} L of water!</span>
                        </p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* 5 Methods Score Bar Comparison */}
              <div className="grid gap-4 sm:grid-cols-5">
                {Object.keys(METHOD_DETAILS).map((k) => {
                  const mKey = k as keyof typeof scores;
                  const meta = METHOD_DETAILS[mKey];
                  const isTop = mKey === topKey;
                  return (
                    <div
                      key={mKey}
                      className={`group rounded-xl border p-4 transition ${
                        isTop
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border bg-card hover:border-coffee/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="h-2 w-8 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {isTop && (
                          <Badge className="rounded-full bg-accent text-[9px] font-bold text-cream hover:bg-accent border-transparent">
                            Top Pick
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-foreground leading-tight">
                        {meta.name.split(" ")[0]}
                      </h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Match Score</span>
                          <span className="font-bold text-foreground">{scores[mKey]}%</span>
                        </div>
                        <Progress
                          value={scores[mKey]}
                          className="h-1 bg-border"
                          style={{ "--progress-background": meta.color } as any}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sustainability & Waste Footprint Calculator */}
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 mt-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Leaf className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      Sustainability & Waste Footprint Calculator
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Waste estimations and environmental compatibility dashboard for batch size:{" "}
                      <strong className="text-foreground">{batchWeight.toLocaleString()} kg</strong>
                      .
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Water footprint */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-blue-500" /> Freshwater Consumed
                      </span>
                      <div className="text-2xl font-extrabold text-blue-600 mt-2">
                        {(batchWeight * recommendedData.waterLiters).toLocaleString()} L
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Total water needed to process this batch size.
                    </p>
                  </div>

                  {/* Wastewater footprint */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-emerald-500" /> Wastewater Generated
                      </span>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-2">
                        {recommendedData.name.includes("Washed")
                          ? `${(batchWeight * recommendedData.waterLiters * 0.85).toLocaleString()} L`
                          : "0 L (Waterless)"}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Acidic effluent requiring eco-treatment ponds.
                    </p>
                  </div>

                  {/* Solid waste */}
                  <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5 text-amber-600" /> Coffee Pulp/Husks Produced
                      </span>
                      <div className="text-2xl font-extrabold text-amber-700 mt-2">
                        {(batchWeight * 0.4).toLocaleString()} kg
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Wet skin/pulp representing ~40% of cherry weight.
                    </p>
                  </div>
                </div>

                {/* Sustainability & Weather Compatibility Comparison Grid */}
                <div className="border-t border-emerald-500/10 pt-6">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    Process Comparison: Sustainability vs. Climate Compatibility
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-border/80 shadow-sm bg-card">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-secondary/15 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="py-3 px-4 font-bold">Process Method</th>
                          <th className="py-3 px-4 text-center font-bold">Eco rating</th>
                          <th className="py-3 px-4 text-right font-bold">Water usage</th>
                          <th className="py-3 px-4 text-center font-bold">Weather feasibility</th>
                          <th className="py-3 px-4 font-bold">Agronomic Logic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processComparisons.map((item) => (
                          <tr
                            key={item.key}
                            className={`border-b border-border/40 hover:bg-secondary/10 transition-colors ${item.key === topKey ? "bg-emerald-500/5 font-semibold" : ""}`}
                          >
                            <td className="py-3 px-4 flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>{item.name}</span>
                              {item.key === topKey && (
                                <Badge className="text-[9px] py-0 px-1.5 bg-emerald-500 text-cream hover:bg-emerald-500 border-transparent rounded">
                                  Top Pick
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center tracking-wider">{item.leaves}</td>
                            <td className="py-3 px-4 text-right font-bold text-foreground">
                              {(batchWeight * item.waterLiters).toLocaleString()} L
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={`rounded text-[10px] font-bold py-0.5 px-2 border ${item.feasibilityClass}`}
                              >
                                {item.feasibility}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-[11px] leading-relaxed max-w-sm">
                              {item.logic}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sustainability rating & actions */}
                <div className="grid gap-6 md:grid-cols-3 mt-6 border-t border-emerald-500/10 pt-6">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Sustainability Rating
                    </span>
                    <div className="flex gap-1 text-xl">
                      {topKey === "natural" || topKey === "wine" ? (
                        <>
                          🌿🌿🌿🌿🌿{" "}
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">
                            Eco-Excellent
                          </span>
                        </>
                      ) : topKey === "honey" ? (
                        <>
                          🌿🌿🌿🌿{" "}
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">
                            Very High
                          </span>
                        </>
                      ) : topKey === "semi_washed" ? (
                        <>
                          🌿🌿🌿{" "}
                          <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full ml-2">
                            Moderate
                          </span>
                        </>
                      ) : (
                        <>
                          🌿{" "}
                          <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full ml-2">
                            Low (Resource Intensive)
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Based on water footprint, chemical discharge, and energy requirements.
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Waste Management Action Plan
                    </span>
                    <div className="bg-card p-3.5 rounded-xl border border-emerald-500/10 text-xs text-foreground font-medium leading-relaxed">
                      {topKey === "washed" &&
                        "Washed process produces heavy acidic wastewater (pH ~4.5) loaded with soluble sugars and pectins. It has a high Chemical Oxygen Demand (COD). Required Action: Run wastewater through a series of anaerobic/aerobic lagoons and apply agricultural lime to neutralize acidity before discharge. Solid pulp must be composted separately."}
                      {topKey === "semi_washed" &&
                        "Semi-washed uses moderate water. Wastewater is acidic and rich in organic matter. Required Action: Divert washwater to a stabilization pond. Compost pulped mucilage and skin with farm manure to produce organic fertilizer."}
                      {topKey === "honey" &&
                        "Honey process generates minimal wastewater since mucilage is left on the bean. Required Action: Zero wastewater discharge. Pulped skins must be immediately spread out to compost, preventing anaerobic rot and foul odors."}
                      {topKey === "wine" &&
                        "Extended anaerobic whole coffee cherry process uses virtually no water, creating zero liquid waste. Required Action: Composting of whole dried cherries after hulling. High nutrient husks make excellent organic mulch."}
                      {topKey === "natural" &&
                        "Natural process is completely waterless, yielding zero wastewater. Required Action: Recycle dried coffee husks (cascara) after hulling as high-potassium organic fertilizer or organic mulch for the coffee trees."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Journal data accordions */}
              <Accordion
                type="single"
                defaultValue="process"
                className="w-full border-t border-border pt-4"
              >
                {/* 1. Process Specs */}
                <AccordionItem value="process" className="border-border">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-bold text-sm text-primary">
                      <Gauge className="h-4 w-4 text-accent" /> Recommended Agronomical Steps
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 pt-2 text-xs">
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Harvest Mode
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.harvest}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Depulping
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.depulping}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Fermentation Type
                      </div>
                      <div className="font-bold text-foreground">
                        {recommendedData.fermentation}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Water Requirement
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.water}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Oxygen State
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.oxygen}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Drying System
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.drying}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Moisture Target
                      </div>
                      <div className="font-bold text-foreground">
                        {recommendedData.moistureTarget}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Main Microbes
                      </div>
                      <div className="font-bold text-foreground flex items-center gap-1">
                        <FlaskConical className="h-3 w-3 text-accent shrink-0" />{" "}
                        {recommendedData.microbe}
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-muted-foreground uppercase text-[9px] tracking-wider font-semibold">
                        Recommended Duration
                      </div>
                      <div className="font-bold text-foreground">{recommendedData.duration}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Chemical/Flavor Output Profile */}
                <AccordionItem value="chemistry" className="border-border">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-bold text-sm text-primary">
                      <FlaskConical className="h-4 w-4 text-accent" /> Predicted Physicochemical &
                      Flavor Output
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-5 text-xs">
                      <div className="space-y-1 bg-secondary/20 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground text-[9px] uppercase font-semibold">
                          pH Target
                        </div>
                        <div className="font-bold text-foreground text-sm">
                          {recommendedData.ph}
                        </div>
                      </div>
                      <div className="space-y-1 bg-secondary/20 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground text-[9px] uppercase font-semibold">
                          Titratable Acidity
                        </div>
                        <div className="font-bold text-foreground text-sm">
                          {recommendedData.acidity}
                        </div>
                      </div>
                      <div className="space-y-1 bg-secondary/20 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground text-[9px] uppercase font-semibold">
                          Ester Volatiles
                        </div>
                        <div className="font-bold text-foreground text-sm">
                          {recommendedData.ester}
                        </div>
                      </div>
                      <div className="space-y-1 bg-secondary/20 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground text-[9px] uppercase font-semibold">
                          Residual Sugar
                        </div>
                        <div className="font-bold text-foreground text-sm">
                          {recommendedData.sugar}
                        </div>
                      </div>
                      <div className="space-y-1 bg-secondary/20 p-2.5 rounded-xl border border-border/40">
                        <div className="text-muted-foreground text-[9px] uppercase font-semibold">
                          Moisture Uniformity
                        </div>
                        <div className="font-bold text-foreground text-sm">
                          {recommendedData.uniformity}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mt-4 text-xs">
                      <div className="p-3 border border-border rounded-xl bg-card">
                        <div className="text-muted-foreground font-semibold text-[10px]">
                          ORGANIC CHEMICAL COMPOUND
                        </div>
                        <ul className="mt-2 space-y-1 text-foreground font-medium">
                          <li>• Caffeine level: {recommendedData.caffeine}</li>
                          <li>• Chlorogenic Acid: {recommendedData.chlorogenic}</li>
                          <li>• Alcohol compound: {recommendedData.alcohol}</li>
                          <li>
                            • Protein/Fat levels: {recommendedData.protein} / {recommendedData.fat}
                          </li>
                        </ul>
                      </div>
                      <div className="p-3 border border-border rounded-xl bg-card md:col-span-2">
                        <div className="text-muted-foreground font-semibold text-[10px]">
                          PREDICTED SENSORY PROFILE
                        </div>
                        <p className="mt-2 text-foreground font-bold text-sm leading-relaxed">
                          {recommendedData.flavor}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          *Flavor outcomes derived from peer-reviewed post-harvest microbiological
                          fermentation profiles.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Drying System Actions */}
                <AccordionItem value="drying" className="border-border">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-bold text-sm text-primary">
                      <Flame className="h-4 w-4 text-accent" /> Drying System Controller & Action
                      Plan
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 border border-accent/20 bg-accent/5 rounded-xl">
                      <div className="flex gap-2.5 items-center">
                        <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                        <div>
                          <div className="font-bold text-foreground text-xs uppercase tracking-wider">
                            Current Decision State
                          </div>
                          <div className="text-sm font-bold text-accent">{dryingAction.status}</div>
                        </div>
                      </div>
                      <div className="bg-accent text-cream font-bold px-3 py-1.5 rounded-lg">
                        Action: {dryingAction.action}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="p-3 border border-border rounded-xl">
                        <h4 className="font-bold text-foreground text-xs">RH &gt;70% Limit</h4>
                        <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">
                          Close solar dryer if rain is detected, or activate heating ventilation if
                          RH is too high.
                        </p>
                      </div>
                      <div className="p-3 border border-border rounded-xl">
                        <h4 className="font-bold text-foreground text-xs">
                          20–35°C Target Temperature
                        </h4>
                        <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">
                          Maintain constant air circulation. Reduce hot airflow if sensor
                          temperature exceeds 35°C.
                        </p>
                      </div>
                      <div className="p-3 border border-border rounded-xl">
                        <h4 className="font-bold text-foreground text-xs">Ideal Moisture Target</h4>
                        <p className="text-muted-foreground text-[11px] mt-1 leading-relaxed">
                          Maintaining bean internal moisture at 10–12% ensures uniform and stable
                          cup quality.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Analytics & Active Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recharts Analytics Panel */}
            <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)] lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Sustainability & Preprocessing Analytics
                </CardTitle>
                <CardDescription>
                  Comparing method compatibility scores against water consumption (Liters per kg
                  Cherry)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {/* Radar chart showing fit values */}
                <div className="h-72 flex flex-col justify-center">
                  <div className="text-xs font-semibold text-center text-muted-foreground mb-1">
                    Preprocessing Match Matrix (%)
                  </div>
                  <ResponsiveContainer width="100%" height="90%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="parameter"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: "600" }}
                      />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar
                        name="Compatibility"
                        dataKey="Score"
                        stroke="var(--accent)"
                        fill="var(--accent)"
                        fillOpacity={0.3}
                      />
                      <RTooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* Bar chart showing water footprint in liters */}
                <div className="h-72 flex flex-col justify-center">
                  <div className="text-xs font-semibold text-center text-muted-foreground mb-1">
                    Water Footprint (Liters per kg Cherry)
                  </div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={waterChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: "600" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RTooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="Liters" fill="var(--chart-4)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <div className="px-6 pb-4 border-t border-border pt-3 text-[11px] text-muted-foreground space-y-1">
                <div>
                  💡 **Eco-awareness**: Washed coffee produces a high wastewater footprint, whereas
                  honey and natural processes save up to 90% water.
                </div>
                <div>
                  🌲 **Resource warning**: Wastewater from washed coffee has high organic solids and
                  requires proper anaerobic ponds for treatment.
                </div>
              </div>
            </Card>

            {/* Real-time alert feed */}
            <Card className="rounded-2xl border-border shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary font-bold">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Agronomic Risk Monitor
                </CardTitle>
                <CardDescription>Generated risk profiles from sensor inputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 p-4 text-xs text-accent font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    No active threats detected. Conditions are optimal.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((a, i) => (
                      <AlertCard key={i} {...a} />
                    ))}
                  </div>
                )}

                {/* Environmental wastewater danger metrics */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <h4 className="text-xs font-bold text-foreground">
                    Wastewater & Environmental Impact
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method impact risk:</span>
                      <span className="font-bold text-foreground">
                        {recommendedData.name.includes("Washed")
                          ? "High (Organic Waste)"
                          : "Very Low"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground leading-relaxed block">
                        {recommendedData.environmentalRisk}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(n: number) {
  return Math.max(5, Math.min(98, Math.round(n)));
}

function FormSliderRow({
  icon: Icon,
  label,
  value,
  onChange,
  max,
  min = 0,
  unit = "",
  description,
}: any) {
  return (
    <div className="space-y-2 bg-secondary/10 p-4 rounded-xl border border-border/40">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          <Icon className="h-4 w-4 text-accent shrink-0" />
          {label}
        </Label>
        <span className="text-xs font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">
          {value[0]} {unit}
        </span>
      </div>
      <div className="flex items-center gap-4 py-1">
        <Slider
          value={value}
          onValueChange={onChange}
          min={min}
          max={max}
          step={1}
          className="flex-1"
        />
        <Input
          type="number"
          value={value[0]}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0;
            onChange([Math.max(min, Math.min(max, val))]);
          }}
          className="w-20 text-right bg-background border-border text-xs font-bold focus:ring-accent"
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function AlertCard({ level, title, desc }: { level: string; title: string; desc: string }) {
  const styles: Record<string, { bg: string; icon: string; text: string }> = {
    danger: {
      bg: "border-destructive/30 bg-destructive/5",
      icon: "text-destructive",
      text: "text-destructive",
    },
    warning: { bg: "border-honey/40 bg-honey/10", icon: "text-honey", text: "text-coffee-deep" },
    info: { bg: "border-border bg-secondary/40", icon: "text-accent", text: "text-foreground" },
  };
  const s = styles[level] || styles.info;
  return (
    <div className={`flex gap-3 rounded-xl border p-3 ${s.bg}`}>
      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} />
      <div>
        <div className={`text-xs font-bold ${s.text}`}>{title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
