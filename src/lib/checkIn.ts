import type { PersonActivity } from "./leaderboard";

// A trainer's view of one member over the last 7 days. Food stays as hit-or-miss day counts,
// so trainers can coach to the targets without seeing what anyone actually ate.
export const WINDOW_DAYS = 7;
export const QUIET_AFTER_DAYS = 4;
const CALORIE_TOLERANCE = 0.1;

export type MemberCheckIn = {
  workouts: number;
  cardioMinutes: number;
  foodDays: number;
  calorieDays: number | null; // null when the member has no target set
  proteinDays: number | null;
  waterDays: number;
  lastActive: string | null;
  daysQuiet: number | null; // null when they've never logged anything
  needsAttention: boolean;
};

export type FoodDay = { calories: number; protein: number };
export type NutritionTargets = { calorieTarget: number | null; proteinTarget: number | null };

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export function buildCheckIn(
  person: PersonActivity,
  food: Map<string, FoodDay>,
  { calorieTarget, proteinTarget }: NutritionTargets,
  today: string
): MemberCheckIn {
  const window = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(today, -i));
  const foodInWindow = window.flatMap((day) => food.get(day) ?? []);

  const logged = [...person.liftDays, ...person.cardioByDay.keys(), ...person.waterByDay.keys(), ...food.keys()];
  const lastActive = logged.filter((day) => day <= today).sort().at(-1) ?? null;
  const daysQuiet = lastActive ? daysBetween(lastActive, today) : null;

  return {
    workouts: window.filter((day) => person.liftDays.has(day)).length,
    cardioMinutes: window.reduce((sum, day) => sum + (person.cardioByDay.get(day) ?? 0), 0),
    foodDays: foodInWindow.length,
    // Within 10% either way, since overshooting a calorie target is a miss too
    calorieDays: calorieTarget
      ? foodInWindow.filter((f) => Math.abs(f.calories - calorieTarget) <= calorieTarget * CALORIE_TOLERANCE).length
      : null,
    proteinDays: proteinTarget ? foodInWindow.filter((f) => f.protein >= proteinTarget).length : null,
    waterDays: window.filter((day) => (person.waterByDay.get(day) ?? 0) >= person.waterTarget).length,
    lastActive,
    daysQuiet,
    needsAttention: daysQuiet === null || daysQuiet >= QUIET_AFTER_DAYS,
  };
}

// Whoever has been quiet longest comes first, starting with anyone who has never logged
export function quietestFirst(a: MemberCheckIn, b: MemberCheckIn) {
  return (b.daysQuiet ?? Infinity) - (a.daysQuiet ?? Infinity) || 0;
}
