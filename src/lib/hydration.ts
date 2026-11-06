// Used for goal progress and badges until the user sets their own target in Settings
export const DEFAULT_WATER_TARGET_ML = 2500;

export const WATER_SERVINGS = [
  { label: "Glass", amount: 250 },
  { label: "Bottle", amount: 500 },
  { label: "Shaker", amount: 750 },
];

function nextDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Turns water entries (oldest first, `day` as local YYYY-MM-DD) into the running totals
// that hydration badges are read from. Each list gains an entry on the day its count ticks up.
export function hydrationTimelines(entries: { day: string; amount: number }[], targetMl: number) {
  const byDay = new Map<string, number>();
  const liters: string[] = [];
  let total = 0;

  for (const { day, amount } of entries) {
    byDay.set(day, (byDay.get(day) ?? 0) + amount);
    total += amount;
    while (liters.length < Math.floor(total / 1000)) liters.push(day);
  }

  const goalDays = [...byDay.entries()].filter(([, ml]) => ml >= targetMl).map(([day]) => day);

  // Running longest streak of back-to-back goal days
  const streak: string[] = [];
  let run = 0;
  goalDays.forEach((day, i) => {
    run = i > 0 && nextDay(goalDays[i - 1]) === day ? run + 1 : 1;
    if (run > streak.length) streak.push(day);
  });

  return { loggedDays: [...byDay.keys()], goalDays, streak, liters };
}
