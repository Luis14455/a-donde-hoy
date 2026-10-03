// A Donde Hoy: servidor pequeño que consulta Google Places (API "New") sin exponer la clave.
// Se publica gratis en Cloudflare Workers. Variables:
//   GOOGLE_PLACES_KEY  (secreto)  clave de Google Cloud con "Places API (New)" activada
//   ALLOWED_ORIGIN     (opcional) dirección de la página web, por ejemplo https://adondehoy.netlify.app
// Ruta: GET /nearby?lat=19.41&lon=-99.16&radius=2000  ->  {places:[...]}

const FIELDS = [
  "places.id", "places.displayName", "places.location", "places.primaryType",
  "places.primaryTypeDisplayName", "places.rating", "places.userRatingCount",
  "places.priceLevel", "places.priceRange", "places.currentOpeningHours.openNow",
  "places.shortFormattedAddress", "places.googleMapsUri", "places.nationalPhoneNumber",
  "places.websiteUri",
].join(",");

// Dos búsquedas de hasta 20 lugares cada una: comida y café/bares.
const GROUPS = [
  ["restaurant", "fast_food_restaurant", "meal_takeaway"],
  ["cafe", "coffee_shop", "bakery", "bar", "pub"],
];

const PRICE = {
  PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function kindOf(type = "") {
  if (/cafe|coffee|bakery|ice_cream|tea|juice|dessert/.test(type)) return "cafe";
  if (/bar|pub|night_club|wine/.test(type)) return "bar";
  if (/fast_food|takeaway|sandwich|hamburger|food_court/.test(type)) return "fast_food";
  return "restaurant";
}

function priceText(range) {
  const a = range?.startPrice?.units, b = range?.endPrice?.units;
  if (a && b) return `$${a}–${b}`;
  if (a) return `desde $${a}`;
  return "";
}

function normalize(p) {
  const label = (p.primaryTypeDisplayName?.text || "").replace(/^Restaurante (de )?/i, "");
  return {
    id: p.id,
    name: p.displayName?.text || "Sin nombre",
    type: kindOf(p.primaryType),
    cuisines: label ? [label.charAt(0).toUpperCase() + label.slice(1)] : [],
    lat: p.location?.latitude,
    lon: p.location?.longitude,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? 0,
    priceLevel: PRICE[p.priceLevel] ?? null,
    priceText: priceText(p.priceRange),
    openNow: p.currentOpeningHours?.openNow ?? null,
    street: p.shortFormattedAddress || "",
    phone: p.nationalPhoneNumber || "",
    web: p.websiteUri || "",
    mapsUrl: p.googleMapsUri || "",
  };
}

async function searchNearby(env, lat, lon, radius, types) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_KEY,
      "X-Goog-FieldMask": FIELDS,
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      languageCode: "es",
      locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius } },
    }),
  });
  if (!res.ok) throw new Error(`Google respondió ${res.status}: ${await res.text()}`);
  return (await res.json()).places || [];
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Content-Type": "application/json; charset=utf-8",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== "/nearby") return new Response('{"error":"ruta no encontrada"}', { status: 404, headers: cors });

    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const radius = Math.min(Number(url.searchParams.get("radius")) || 2000, 5000);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return new Response('{"error":"lat y lon inválidas"}', { status: 400, headers: cors });
    }

    try {
      const batches = await Promise.all(GROUPS.map((t) => searchNearby(env, lat, lon, radius, t)));
      const seen = new Set();
      const places = batches.flat().filter((p) => !seen.has(p.id) && seen.add(p.id)).map(normalize)
        .filter((p) => p.lat != null && p.lon != null);
      return new Response(JSON.stringify({ places }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 502, headers: cors });
    }
  },
};
