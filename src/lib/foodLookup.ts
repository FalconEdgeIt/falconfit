// Packaged food data from Open Food Facts (open database, no key needed).
const SEARCH_URL = "https://search.openfoodfacts.org/search";
const PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "code,product_name,brands,serving_size,serving_quantity,serving_quantity_unit,nutriments";
const HEADERS = { "User-Agent": "FalconFit/1.0 (https://www.falconedgeit.ca)" };
const REQUEST = { headers: HEADERS, next: { revalidate: 86400 } };
const TIMEOUT_MS = 8000;
const RESULT_LIMIT = 12;

export type FoodProduct = {
  code: string;
  name: string;
  brand: string | null;
  // Per 100 g, or per 100 ml for drinks
  per100: { calories: number; protein: number; carbs: number; fat: number };
  unit: "g" | "ml";
  servingAmount: number | null;
  servingLabel: string | null;
};

type RawProduct = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  serving_quantity?: number | string;
  serving_quantity_unit?: string;
  nutriments?: Record<string, unknown>;
};

function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

// Returns null unless the product has a name and believable, complete macros.
// The database is crowd-sourced, so gaps and typos are common.
function toFoodProduct(raw: RawProduct): FoodProduct | null {
  const n = raw.nutriments ?? {};
  const kilojoules = toNumber(n["energy-kj_100g"]);
  const calories = toNumber(n["energy-kcal_100g"]) ?? (kilojoules === null ? null : kilojoules / 4.184);
  const protein = toNumber(n["proteins_100g"]);
  const carbs = toNumber(n["carbohydrates_100g"]);
  const fat = toNumber(n["fat_100g"]);
  const name = raw.product_name?.trim();

  if (!raw.code || !name) return null;
  if (calories === null || protein === null || carbs === null || fat === null) return null;
  if (calories > 900 || protein + carbs + fat > 105) return null;

  const brand = Array.isArray(raw.brands) ? raw.brands[0] : raw.brands?.split(",")[0];
  const servingAmount = toNumber(raw.serving_quantity);

  return {
    code: raw.code,
    name,
    brand: brand?.trim() || null,
    per100: { calories, protein, carbs, fat },
    unit: raw.serving_quantity_unit === "ml" ? "ml" : "g",
    servingAmount: servingAmount || null,
    servingLabel: raw.serving_size?.trim() || null,
  };
}

async function searchHits(query: string): Promise<RawProduct[]> {
  const params = new URLSearchParams({ q: query, page_size: "20", fields: FIELDS });
  const res = await fetch(`${SEARCH_URL}?${params}`, { ...REQUEST, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Food search failed: ${res.status}`);
  return (await res.json()).hits ?? [];
}

// Canadian listings come first so local brands beat the same name from elsewhere,
// and the worldwide search fills in anything they miss.
export async function searchFoods(query: string): Promise<FoodProduct[]> {
  // These characters are search syntax, and a stray one makes the whole query fail
  const terms = query.replace(/["():]/g, " ").trim();
  if (!terms) return [];

  const [canadian, worldwide] = await Promise.all([
    searchHits(`${terms} countries_tags:"en:canada"`),
    searchHits(terms),
  ]);

  const seen = new Set<string>();
  const products: FoodProduct[] = [];
  for (const raw of [...canadian, ...worldwide]) {
    const product = toFoodProduct(raw);
    if (!product || seen.has(product.code)) continue;
    seen.add(product.code);
    products.push(product);
  }
  return products.slice(0, RESULT_LIMIT);
}

// `name` is set when the product exists but its label data is too incomplete to use
export async function lookupBarcode(barcode: string): Promise<{ product: FoodProduct | null; name: string | null }> {
  const res = await fetch(`${PRODUCT_URL}/${barcode}.json?fields=${FIELDS}`, {
    ...REQUEST,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 404) return { product: null, name: null };
  if (!res.ok) throw new Error(`Barcode lookup failed: ${res.status}`);

  const data = await res.json();
  if (data.status !== 1 || !data.product) return { product: null, name: null };

  return {
    product: toFoodProduct(data.product),
    name: data.product.product_name?.trim() || null,
  };
}
