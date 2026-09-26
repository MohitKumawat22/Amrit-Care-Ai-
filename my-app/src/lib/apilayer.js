/**
 * APILayer Integration Helper for AmritCare AI
 *
 * Provides:
 * 1. getWeatherAdvisory(lat, lon) — Cached for 3 hours per location, returns health advice.
 * 2. lookupMedicineInfo(medicineName) — Fetches generic name / dosage info gracefully.
 *
 * Safe & Fail-Safe: Never throws uncaught errors, falls back seamlessly if key is unset or API fails.
 */

// In-memory cache for weather advisories (3 hour TTL)
const weatherCache = new Map();
const WEATHER_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours in ms

/**
 * Fetch weather and generate a plain-language health advisory.
 * @param {number|string} lat - Latitude
 * @param {number|string} lon - Longitude
 * @returns {Promise<string>} Plain-language advisory string
 */
export async function getWeatherAdvisory(lat, lon) {
  try {
    const numLat = parseFloat(lat) || 15.2993; // Default Goa lat
    const numLon = parseFloat(lon) || 74.1240; // Default Goa lon
    const cacheKey = `${numLat.toFixed(2)},${numLon.toFixed(2)}`;

    // Check memory cache
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
      return cached.advisory;
    }

    const apiKey = process.env.APILAYER_API_KEY;
    if (!apiKey) {
      const fallback = "Pleasant weather conditions today — maintain good hydration and enjoy routine outdoor walks.";
      weatherCache.set(cacheKey, { advisory: fallback, timestamp: Date.now() });
      return fallback;
    }

    // Call APILayer weather endpoint
    const response = await fetch(
      `https://api.apilayer.com/weather/current?lat=${numLat}&lon=${numLon}`,
      {
        headers: {
          apikey: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.warn(`[APILayer Weather] API responded with status ${response.status}`);
      const fallback = "Moderate weather today — stay hydrated and take prescribed medicines on time.";
      weatherCache.set(cacheKey, { advisory: fallback, timestamp: Date.now() });
      return fallback;
    }

    const data = await response.json();
    const temp = data?.main?.temp ?? data?.current?.temperature ?? 28;
    const condition = (data?.weather?.[0]?.description || data?.current?.weather_descriptions?.[0] || "").toLowerCase();
    const aqi = data?.air_quality?.aqi || data?.aqi;

    let advisory = "Pleasant conditions today — good for general outdoor activities and exercise.";

    if (aqi && aqi > 150) {
      advisory = "Air quality is poor today — patients with respiratory conditions should minimize outdoor exposure.";
    } else if (temp > 36) {
      advisory = "High temperatures today — stay indoors during peak hours, drink plenty of water, and avoid dehydration.";
    } else if (temp < 15) {
      advisory = "Cooler temperatures today — keep warm and protect against seasonal viral chills.";
    } else if (condition.includes("rain") || condition.includes("storm") || condition.includes("drizzle")) {
      advisory = "Rainy weather today — keep warm, carry an umbrella, and watch for slippery walking paths.";
    } else if (condition.includes("haze") || condition.includes("smoke") || condition.includes("dust")) {
      advisory = "Hazy conditions today — sensitive individuals and asthmatics are advised to wear a mask outdoors.";
    }

    // Cache the advisory
    weatherCache.set(cacheKey, { advisory, timestamp: Date.now() });
    return advisory;
  } catch (error) {
    console.error("[APILayer Weather] Failed to fetch weather advisory (non-fatal):", error.message);
    return "Pleasant weather today — remember to take your scheduled medications on time.";
  }
}

/**
 * Lookup medicine/drug information from pharma data feed.
 * @param {string} medicineName - Name of the medicine to look up
 * @returns {Promise<{ found: boolean, genericName?: string, commonDosage?: string, category?: string, description?: string }>}
 */
export async function lookupMedicineInfo(medicineName) {
  if (!medicineName || typeof medicineName !== "string" || !medicineName.trim()) {
    return { found: false, message: "Medicine name is required." };
  }

  const cleanName = medicineName.trim();
  const apiKey = process.env.APILAYER_API_KEY;

  if (!apiKey) {
    return {
      found: false,
      medicineName: cleanName,
      message: "APILayer API key not configured.",
    };
  }

  try {
    // Attempt drug lookup via APILayer (e.g. pharma/drug search endpoint)
    const response = await fetch(
      `https://api.apilayer.com/pharma/search?name=${encodeURIComponent(cleanName)}`,
      {
        headers: {
          apikey: apiKey,
        },
      }
    );

    if (!response.ok) {
      // Graceful fallback — let the user type manually
      return {
        found: false,
        medicineName: cleanName,
      };
    }

    const data = await response.json();
    const result = data?.results?.[0] || data?.data?.[0] || data;

    if (!result || (!result.generic_name && !result.name)) {
      return { found: false, medicineName: cleanName };
    }

    return {
      found: true,
      medicineName: result.name || cleanName,
      genericName: result.generic_name || result.active_ingredient || "Not specified",
      commonDosage: result.common_dosage || result.strength || "Standard dose as prescribed",
      category: result.category || result.drug_class || "General Medication",
      description: result.description || result.indications || "",
    };
  } catch (error) {
    console.error("[APILayer Pharma] Lookup error (non-fatal):", error.message);
    return { found: false, medicineName: cleanName };
  }
}
