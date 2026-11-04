import type { Achievement, BoxTier } from "./achievements";

// Everything the dashboard HUD derives from data the user has already logged. Pure functions,
// so they're safe to use from client components.

const BOX_XP: Record<BoxTier, number> = { Bronze: 25, Silver: 75, Gold: 200, Platinum: 500, Legendary: 1000 };
const XP_PER_WORKOUT = 50;
const XP_PER_CARDIO = 25;

const RANKS: { level: number; title: string }[] = [
  { level: 1, title: "Fresh Meat" },
  { level: 3, title: "Rookie" },
  { level: 6, title: "Regular" },
  { level: 10, title: "Gym Rat" },
  { level: 15, title: "Iron Warrior" },
  { level: 21, title: "Beast" },
  { level: 28, title: "Champ" },
  { level: 36, title: "Legend" },
];

export type ActivityDay = { day: string; lifted: boolean; cardio: boolean; isToday: boolean; future: boolean };

export function toLocalDay(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Level n takes 100 × n XP to clear, so each level is a little longer than the last
export function getLevel(xp: number) {
  let level = 1;
  let remaining = xp;
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level += 1;
  }
  const rank = [...RANKS].reverse().find((r) => level >= r.level)!;
  const nextRank = RANKS.find((r) => r.level > level) ?? null;
  return { level, xpIntoLevel: remaining, xpForLevel: level * 100, rank: rank.title, nextRank };
}

export function getXp(workoutDays: number, cardioSessions: number, achievements: Achievement[]) {
  const boxes = achievements.reduce((sum, a) => sum + BOX_XP[a.box] * a.timesEarned, 0);
  return workoutDays * XP_PER_WORKOUT + cardioSessions * XP_PER_CARDIO + boxes;
}

function mondayOf(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// `weeks` columns of Monday-to-Sunday days, ending with the current week
export function getActivityGrid(liftDays: Set<string>, cardioDays: Set<string>, today: Date, weeks: number) {
  const todayKey = toLocalDay(today);
  const start = mondayOf(today);
  start.setDate(start.getDate() - (weeks - 1) * 7);

  return Array.from({ length: weeks * 7 }, (_, i): ActivityDay => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const day = toLocalDay(d);
    return {
      day,
      lifted: liftDays.has(day),
      cardio: cardioDays.has(day),
      isToday: day === todayKey,
      future: day > todayKey,
    };
  });
}

// Consecutive weeks with any activity. The current week doesn't break a streak until it's over.
export function getWeekStreak(activeDays: Set<string>, today: Date) {
  const weekIsActive = (monday: Date) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return toLocalDay(d);
    }).some((day) => activeDays.has(day));

  const thisWeek = mondayOf(today);
  const activeThisWeek = weekIsActive(thisWeek);
  let streak = activeThisWeek ? 1 : 0;

  const cursor = new Date(thisWeek);
  for (;;) {
    cursor.setDate(cursor.getDate() - 7);
    if (!weekIsActive(cursor)) break;
    streak += 1;
  }
  return { streak, activeThisWeek };
}

export type Directive = {
  headline: string;
  quip: string;
  action: "start" | "build" | "food";
  dayId?: string;
  dayName?: string;
};

function pick(lines: string[], today: Date) {
  const dayNumber = Math.floor(today.getTime() / 86400000);
  return lines[dayNumber % lines.length];
}

// What the System tells the user to do right now
export function getDirective(input: {
  today: Date;
  days: { id: string; name: string }[];
  lastDayName: string | null; // workout day most recently logged
  trainedToday: boolean;
  daysSinceActive: number | null;
  streak: number;
  activeThisWeek: boolean;
}): Directive {
  const { today, days, lastDayName, trainedToday, daysSinceActive, streak, activeThisWeek } = input;

  if (days.length === 0) {
    return {
      headline: "Build your first workout",
      quip: "The System can't judge your form until you have some. Add a workout day to begin.",
      action: "build",
    };
  }

  if (trainedToday) {
    return {
      headline: "Today's work is logged",
      quip: pick(
        [
          "Go eat something. That also counts as training, apparently.",
          "Adequate. The System has updated your file. Protein next.",
          "You may leave the gym now. The squat rack will miss you.",
        ],
        today
      ),
      action: "food",
    };
  }

  const lastIndex = days.findIndex((d) => d.name === lastDayName);
  const next = days[(lastIndex + 1) % days.length];
  const base = { action: "start" as const, dayId: next.id, dayName: next.name };

  if (streak > 0 && !activeThisWeek && today.getDay() !== 1) {
    return {
      ...base,
      headline: `Your ${streak}-week streak is on the line`,
      quip: "One session before Sunday keeps it alive. The System has already drafted the obituary, just in case.",
    };
  }

  if (daysSinceActive !== null && daysSinceActive >= 4) {
    return {
      ...base,
      headline: `${daysSinceActive} days. The System noticed.`,
      quip: `Your couch sends its regards. ${next.name} is waiting, and it isn't angry. Just disappointed.`,
    };
  }

  return {
    ...base,
    headline: `${next.name} is up`,
    quip: pick(
      [
        "The weights aren't going to lift themselves. The System checked.",
        "Hear the System now, flex later.",
        "Yesterday's excuses have expired. New ones require a permit.",
        "Do the work. The System will handle the sarcasm.",
      ],
      today
    ),
  };
}
