export const MEALS = ["Breakfast", "Lunch", "Dinner", "Snacks"] as const;

export type Meal = (typeof MEALS)[number];

export function isMeal(value: unknown): value is Meal {
  return MEALS.includes(value as Meal);
}

// The likely meal for a time of day. Also places older entries logged before meals existed.
export function mealForTime(date: Date): Meal {
  const hour = date.getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 14) return "Lunch";
  if (hour >= 17 && hour < 21) return "Dinner";
  return "Snacks";
}
