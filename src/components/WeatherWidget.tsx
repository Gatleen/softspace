import { useEffect, useState } from "react";
import { Box, Text, VStack, HStack, Image, Skeleton } from "@chakra-ui/react";
import { MapPin, Wind } from "lucide-react";

const WeatherWidget = () => {
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    code: number;
    isDay: boolean;
    windspeed: number;
  } | null>(null);
  const [locationName, setLocationName] = useState("Locating...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
      () => { setError("Location access denied"); setLoading(false); }
    );
  }, []);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const [weatherRes, geoRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`),
      ]);
      const weatherData = await weatherRes.json();
      const geoData = await geoRes.json();
      const cw = weatherData.current_weather;
      setWeather({
        temp: Math.round(cw.temperature),
        code: cw.weathercode,
        isDay: !!cw.is_day,
        condition: getCondition(cw.weathercode),
        windspeed: Math.round(cw.windspeed),
      });
      setLocationName(geoData.city || geoData.locality || "Unknown Location");
    } catch {
      setError("Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const getCondition = (code: number) => {
    if (code === 0) return "Clear Sky";
    if (code <= 3)  return "Partly Cloudy";
    if (code <= 48) return "Misty / Foggy";
    if (code <= 55) return "Light Drizzle";
    if (code <= 67) return "Heavy Rain";
    if (code <= 77) return "Snowy";
    if (code <= 82) return "Showers";
    if (code >= 95) return "Thunderstorm";
    return "Mixed";
  };

  const getIcon = (code: number, isDay: boolean) => {
    const p = "/weather";
    if (!isDay && code <= 3) return `${p}/Night.png`;
    if (code === 0)  return `${p}/Sunny.png`;
    if (code <= 3)   return `${p}/Cloudy.png`;
    if (code <= 48)  return `${p}/Windy.png`;
    if (code <= 55)  return `${p}/LightShowers.png`;
    if (code <= 67)  return `${p}/HeavyRain.png`;
    if (code >= 95)  return `${p}/Thunderstorm.png`;
    return `${p}/Sunny.png`;
  };

  // Dynamic sky gradient based on conditions + day/night
  const getSkyGradient = (code: number, isDay: boolean) => {
    if (!isDay) return "linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6d28d9 100%)";
    if (code === 0)  return "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 60%, #7c3aed 100%)";
    if (code <= 3)   return "linear-gradient(135deg, #7dd3fc 0%, #93c5fd 60%, #a5b4fc 100%)";
    if (code <= 48)  return "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)";
    if (code <= 67)  return "linear-gradient(135deg, #334155 0%, #475569 60%, #64748b 100%)";
    if (code <= 77)  return "linear-gradient(135deg, #bfdbfe 0%, #ddd6fe 100%)";
    if (code >= 95)  return "linear-gradient(135deg, #1f2937 0%, #374151 60%, #4b5563 100%)";
    return "linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%)";
  };

  return (
    <Box
      bg="white"
      borderRadius="24px"
      border="2.5px solid"
      borderColor="#D8E9FB"
      boxShadow="0 6px 0 rgba(189,224,254,.5)"
      overflow="hidden"
    >
      {/* Sky gradient header */}
      <Box
        style={{ background: weather ? getSkyGradient(weather.code, weather.isDay) : "linear-gradient(135deg,#BDE0FE,#C9C4F5)" }}
        px={5} pt="18px" pb="26px"
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" right="-20px" top="-20px" w="90px" h="90px" borderRadius="999px" bg="rgba(255,255,255,.28)" />

        <HStack justify="space-between" align="start" position="relative">
          <VStack align="start" gap={0}>
            <HStack gap={2} mb={1}>
              <Image src="/icons/Rainbow.png" boxSize="22px" objectFit="contain" />
              <Text fontSize="10.5px" fontWeight="800" color="rgba(255,255,255,.95)"
                textTransform="uppercase" letterSpacing="3px">
                Weather
              </Text>
            </HStack>
            {loading ? (
              <Skeleton h="48px" w="100px" borderRadius="xl" />
            ) : error ? (
              <Text fontSize="sm" color="red.200">{error}</Text>
            ) : (
              <>
                <Text
                  fontFamily="'Jersey 25', cursive" fontSize="62px" lineHeight="1"
                  color="white" mt="6px"
                  textShadow="0 3px 0 rgba(91,143,214,.4)"
                >
                  {weather?.temp}°
                </Text>
                <Text fontSize="13px" fontWeight="800" color="white" mt="2px">
                  {weather?.condition}
                </Text>
              </>
            )}
          </VStack>

          {/* Weather icon */}
          {!loading && !error && weather && (
            <Image
              src={getIcon(weather.code, weather.isDay)}
              alt="Weather"
              w="80px" h="80px"
              objectFit="contain"
              style={{ filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.2))" }}
              transition="transform 0.3s"
              _hover={{ transform: "scale(1.1) rotate(8deg)" }}
            />
          )}
        </HStack>
      </Box>

      {/* Info strip */}
      {!loading && !error && weather && (
        <HStack px="18px" py="12px" justify="space-between" bg="white">
          <HStack gap={1}>
            <MapPin size={13} color="#A08B9B" />
            <Text fontSize="11.5px" color="#A08B9B" fontWeight="700">{locationName}</Text>
          </HStack>
          <HStack gap="10px">
            <HStack gap={1}>
              <Wind size={13} color="#A08B9B" />
              <Text fontSize="11.5px" color="#A08B9B" fontWeight="700">
                {weather.windspeed} km/h
              </Text>
            </HStack>
            <Box
              px="9px" py="3px" borderRadius="999px"
              bg={weather.isDay ? "#FFF6E5" : "#F6F0FF"}
              border="1.5px solid"
              borderColor={weather.isDay ? "#FFE0AF" : "#EEDCFB"}
            >
              <Text fontSize="10px" fontWeight="800"
                color={weather.isDay ? "#C99A3E" : "#8A6BD1"}>
                {weather.isDay ? "☀ Daytime" : "🌙 Nighttime"}
              </Text>
            </Box>
          </HStack>
        </HStack>
      )}

      {loading && (
        <VStack px={5} py={3} align="stretch" gap={2}>
          <Skeleton h="12px" w="60%" borderRadius="full" />
        </VStack>
      )}
    </Box>
  );
};

export default WeatherWidget;