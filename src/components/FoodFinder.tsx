"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ScanBarcode, Search, X } from "lucide-react";
import BarcodeScanner from "./BarcodeScanner";
import { FOOD_LIBRARY } from "../lib/foodLibrary";
import type { FoodProduct } from "../lib/foodLookup";
import { MEALS, mealForTime, type Meal } from "../lib/meals";
import type { Macros, NewFood, SavedMeal } from "./useFoodLog";

// One thing the user can pick. `macros` covers one `servingLabel`. When `gramsPerServing`
// is known the amount can also be entered by weight.
type FoodChoice = {
  key: string;
  name: string;
  detail: string;
  source: "recent" | "common" | "product";
  macros: Macros;
  servingLabel: string;
  gramsPerServing: number | null;
  unit: "g" | "ml";
};

const SEARCH_DELAY_MS = 350;
const RECENT_LIMIT = 8;

const round1 = (n: number) => Math.round(n * 10) / 10;

function scale(macros: Macros, factor: number): Macros {
  return {
    calories: Math.round(macros.calories * factor),
    protein: round1(macros.protein * factor),
    carbs: round1(macros.carbs * factor),
    fat: round1(macros.fat * factor),
  };
}

function matches(text: string, query: string) {
  const haystack = text.toLowerCase();
  return query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

function productChoice(p: FoodProduct): FoodChoice {
  const amount = p.servingAmount ?? 100;
  return {
    key: `product-${p.code}`,
    name: p.brand ? `${p.brand} ${p.name}` : p.name,
    detail: `${Math.round(p.per100.calories)} cal per 100 ${p.unit}`,
    source: "product",
    macros: scale(p.per100, amount / 100),
    servingLabel: p.servingAmount ? p.servingLabel || `${amount} ${p.unit}` : `100 ${p.unit}`,
    gramsPerServing: amount,
    unit: p.unit,
  };
}

const COMMON_CHOICES: FoodChoice[] = FOOD_LIBRARY.map(({ name, serving, ...macros }) => ({
  key: `common-${name}`,
  name,
  detail: `${macros.calories} cal per ${serving}`,
  source: "common",
  macros,
  servingLabel: serving,
  gramsPerServing: null,
  unit: "g",
}));

const inputClass = "bg-gray-700 p-2.5 rounded text-base";

export default function FoodFinder({
  recentEntries,
  savedMeals,
  onLog,
  onDeleteSaved,
}: {
  recentEntries: (Macros & { name: string })[]; // newest first
  savedMeals: SavedMeal[];
  onLog: (food: NewFood) => Promise<boolean>;
  onDeleteSaved: (id: string) => void;
}) {
  const [meal, setMeal] = useState<Meal>(() => mealForTime(new Date()));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; choices: FoodChoice[]; failed: boolean } | null>(null);
  const [selected, setSelected] = useState<FoodChoice | null>(null);
  const [amount, setAmount] = useState("1");
  const [byWeight, setByWeight] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState("");
  const [showManual, setShowManual] = useState(false);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const term = query.trim();

  const recents = useMemo(() => {
    const seen = new Set<string>();
    const choices: FoodChoice[] = [];
    for (const { name, calories, protein, carbs, fat } of recentEntries) {
      const id = name.toLowerCase();
      const macros = { calories, protein, carbs, fat };
      if (seen.has(id)) continue;
      seen.add(id);
      choices.push({
        key: `recent-${id}`,
        name,
        detail: `${Math.round(macros.calories)} cal as logged`,
        source: "recent",
        macros,
        servingLabel: "as logged",
        gramsPerServing: null,
        unit: "g",
      });
    }
    return choices;
  }, [recentEntries]);

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/food/lookup?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const products: FoodProduct[] = await res.json();
        setResults({ query: term, choices: products.map(productChoice), failed: false });
      } catch {
        if (!controller.signal.aborted) setResults({ query: term, choices: [], failed: true });
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const searched = results?.query === term ? results : null;
  const localMatches =
    term.length < 2
      ? recents.slice(0, RECENT_LIMIT)
      : [...recents.slice(0, 40), ...COMMON_CHOICES].filter((c) => matches(c.name, term)).slice(0, 8);

  const visibleSaved = savedMeals.filter((m) => term.length < 2 || matches(m.name, term));

  const log = async (food: Macros & { name: string }) => {
    const logged = await onLog({ ...food, meal });
    if (logged) setNotice(`Logged ${food.name} to ${meal}.`);
    return logged;
  };

  const openManual = (prefillName: string) => {
    setName(prefillName);
    setShowManual(true);
  };

  const pick = (choice: FoodChoice) => {
    setSelected(choice);
    setAmount("1");
    setByWeight(false);
    setNotice("");
  };

  const clearSearch = () => {
    setSelected(null);
    setQuery("");
  };

  // Search results don't include serving sizes, so fetch the full product once it's picked
  const pickProduct = async (choice: FoodChoice) => {
    pick(choice);
    const code = choice.key.replace("product-", "");
    try {
      const res = await fetch(`/api/food/lookup?barcode=${code}`);
      if (!res.ok) return;
      const full = productChoice(await res.json());
      setSelected((current) => (current?.key === choice.key ? full : current));
    } catch {
      // The per-100 figures from the search still work
    }
  };

  const handleBarcode = useCallback(async (barcode: string) => {
    setScanning(false);
    setSelected(null);
    setNotice("Looking up that barcode...");
    try {
      const res = await fetch(`/api/food/lookup?barcode=${barcode}`);
      if (res.ok) {
        const choice = productChoice(await res.json());
        setSelected(choice);
        setAmount("1");
        setByWeight(false);
        setNotice("");
      } else if (res.status === 404) {
        const data = await res.json();
        setNotice(
          data.name
            ? `Found ${data.name}, but its nutrition facts are incomplete. Enter them from the label.`
            : `Barcode ${barcode} isn't in the database yet. Enter it from the label.`
        );
        setName(data.name ?? "");
        setShowManual(true);
      } else {
        setNotice("Couldn't reach the food database. Try again, or enter it manually.");
      }
    } catch {
      setNotice("Couldn't reach the food database. Try again, or enter it manually.");
    }
  }, []);

  const quantity = Number(amount);
  const validAmount = Number.isFinite(quantity) && quantity > 0;
  const factor = selected && byWeight && selected.gramsPerServing ? quantity / selected.gramsPerServing : quantity;
  const preview = selected && validAmount ? scale(selected.macros, factor) : null;

  const logSelected = async () => {
    if (!selected || !preview) return;

    let label = selected.name;
    if (byWeight) label += ` (${quantity} ${selected.unit})`;
    else if (selected.source === "recent") label += quantity === 1 ? "" : ` x${quantity}`;
    else label += ` (${quantity === 1 ? "" : `${quantity} x `}${selected.servingLabel})`;

    if (await log({ name: label, ...preview })) clearSearch();
  };

  const logManual = async () => {
    if (!name.trim() || !calories) return;
    const logged = await log({
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    if (!logged) return;
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setShowManual(false);
  };

  const choiceRow = (choice: FoodChoice) => (
    <button
      key={choice.key}
      onClick={() => (choice.source === "product" ? pickProduct(choice) : pick(choice))}
      className="w-full text-left flex items-center justify-between gap-3 bg-gray-700/60 hover:bg-gray-700 rounded-lg px-3 py-2.5"
    >
      <span className="min-w-0">
        <span className="block font-semibold truncate">{choice.name}</span>
        <span className="block text-gray-400 text-sm">{choice.detail}</span>
      </span>
      <Plus size={18} className="shrink-0 text-gray-400" />
    </button>
  );

  return (
    <div>
      <div className="flex gap-1.5 mb-4" role="group" aria-label="Meal">
        {MEALS.map((option) => (
          <button
            key={option}
            aria-pressed={meal === option}
            onClick={() => setMeal(option)}
            className={`flex-1 min-w-0 py-2 rounded text-xs sm:text-sm font-medium ${
              meal === option ? "bg-red-600 text-white" : "bg-gray-700/60 text-gray-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {selected ? (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-lg leading-snug">{selected.name}</p>
              <p className="text-gray-400 text-sm">
                {selected.source === "recent" ? "One serving, as you logged it" : `1 serving = ${selected.servingLabel}`}
              </p>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Back to search" className="p-1 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              aria-label={byWeight ? `Amount in ${selected.unit}` : "Number of servings"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} w-24`}
            />
            {selected.gramsPerServing ? (
              <div className="flex rounded overflow-hidden border border-gray-600 text-sm">
                {[false, true].map((weight) => (
                  <button
                    key={String(weight)}
                    aria-pressed={byWeight === weight}
                    onClick={() => {
                      setByWeight(weight);
                      setAmount(weight ? String(selected.gramsPerServing) : "1");
                    }}
                    className={`px-3 py-2 ${byWeight === weight ? "bg-red-600 text-white" : "text-gray-300"}`}
                  >
                    {weight ? selected.unit : "servings"}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">{quantity === 1 ? "serving" : "servings"}</span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 text-center">
            {[
              ["Calories", preview?.calories],
              ["Protein", preview && `${preview.protein}g`],
              ["Carbs", preview && `${preview.carbs}g`],
              ["Fat", preview && `${preview.fat}g`],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-700/60 rounded-lg py-2.5">
                <p className="font-display font-extrabold text-2xl leading-none tabular-nums">{value ?? "-"}</p>
                <p className="text-gray-400 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {selected.source === "product" && (
            <p className="text-gray-500 text-xs mt-3">
              Community data from{" "}
              <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="underline">
                Open Food Facts
              </a>
              . Check it against the label if the numbers look off.
            </p>
          )}

          <button
            onClick={logSelected}
            disabled={!preview}
            className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 py-3 rounded-lg font-semibold"
          >
            Log it
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search foods and brands"
                aria-label="Search foods and brands"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${inputClass} w-full pl-10`}
              />
            </div>
            <button
              onClick={() => setScanning(true)}
              aria-label="Scan a barcode"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3.5 rounded font-semibold"
            >
              <ScanBarcode size={20} />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>

          {notice && <p className="text-gray-300 text-sm mt-3">{notice}</p>}

          {visibleSaved.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Go-to meals</p>
              <div className="space-y-2">
                {visibleSaved.map(({ id, name, calories, protein, carbs, fat }) => (
                  <div key={id} className="flex items-stretch gap-1 bg-gray-700/60 rounded-lg">
                    <button
                      onClick={() => log({ name, calories, protein, carbs, fat })}
                      className="flex-1 min-w-0 text-left flex items-center justify-between gap-3 hover:bg-gray-700 rounded-lg px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold truncate">{name}</span>
                        <span className="block text-gray-400 text-sm">
                          {Math.round(calories)} cal · {Math.round(protein)}g protein
                        </span>
                      </span>
                      <Plus size={18} className="shrink-0 text-red-400" />
                    </button>
                    <button
                      onClick={() => onDeleteSaved(id)}
                      aria-label={`Remove ${name} from go-to meals`}
                      className="px-2.5 text-gray-500 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localMatches.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{term.length < 2 ? "Recent" : "Quick picks"}</p>
              <div className="space-y-2">{localMatches.map(choiceRow)}</div>
            </div>
          )}

          {term.length >= 2 && (
            <div className="mt-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Packaged foods</p>
              {!searched && <p className="text-gray-500 text-sm">Searching...</p>}
              {searched?.failed && <p className="text-gray-400 text-sm">Couldn&apos;t reach the food database. Try again shortly.</p>}
              {searched && !searched.failed && searched.choices.length === 0 && (
                <p className="text-gray-500 text-sm">No packaged foods found. Try the brand name, or scan the barcode.</p>
              )}
              {searched && searched.choices.length > 0 && <div className="space-y-2">{searched.choices.map(choiceRow)}</div>}
            </div>
          )}

          <div className="mt-4">
            {showManual ? (
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Food name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${inputClass} flex-1 min-w-[160px]`}
                />
                <input type="number" placeholder="Calories" value={calories} onChange={(e) => setCalories(e.target.value)} className={`${inputClass} w-28`} />
                <input type="number" placeholder="Protein (g)" value={protein} onChange={(e) => setProtein(e.target.value)} className={`${inputClass} w-28`} />
                <input type="number" placeholder="Carbs (g)" value={carbs} onChange={(e) => setCarbs(e.target.value)} className={`${inputClass} w-28`} />
                <input type="number" placeholder="Fat (g)" value={fat} onChange={(e) => setFat(e.target.value)} className={`${inputClass} w-28`} />
                <button onClick={logManual} className="bg-red-600 px-4 py-2 rounded">
                  Add
                </button>
              </div>
            ) : (
              <button onClick={() => openManual(term)} className="text-sm text-gray-400 hover:text-white underline">
                Enter it manually
              </button>
            )}
          </div>
        </>
      )}

      {scanning && <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />}
    </div>
  );
}
