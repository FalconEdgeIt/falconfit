import { prisma } from "./prisma";

// Achievements are derived from existing activity data rather than stored, so they apply
// retroactively and can never drift out of sync with what a user has actually logged.

export type AchievementCategory = "Workouts" | "Consistency" | "Strength" | "Cardio" | "Body Weight" | "Nutrition";

// Loot box rarity awarded with each badge — purely cosmetic, lowest to highest
export type BoxTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Legendary";

export type Achievement = {
  id: string;
  name: string;
  description: string; // the plain requirement, shown while locked
  quip: string; // the System's commentary, revealed once earned
  box: BoxTier;
  icon: string;
  category: AchievementCategory;
  earned: boolean;
  earnedAt: string | null; // YYYY-MM-DD (user's local day) first earned
  lastEarnedAt: string | null; // most recent time earned (same as earnedAt unless repeatable)
  repeatable?: boolean; // earned again every time it happens (each PR, each cardio session…)
  timesEarned: number;
  progress: number;
  target: number;
  unit?: string; // shown after progress numbers, e.g. "k lbs"
};

type Definition = Omit<Achievement, "earned" | "earnedAt" | "lastEarnedAt" | "timesEarned" | "progress">;
type Level = Pick<Achievement, "target" | "name" | "icon" | "description" | "quip" | "box" | "repeatable">;

// A sorted list of the local days on which a running total ticks up, so "earned on" can be
// read off as the day the total first reached the target.
type Timeline = string[];

function estimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

// tzOffset is Date.getTimezoneOffset() from the browser (minutes, positive west of UTC)
function localDay(date: Date, tzOffset: number) {
  return new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);
}

// Monday of the week containing the given YYYY-MM-DD, as YYYY-MM-DD
function weekStart(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function fromTimeline(def: Definition, timeline: Timeline): Achievement {
  const earned = timeline.length >= def.target;
  // A repeatable badge (always target 1) is earned once per timeline entry
  const timesEarned = !earned ? 0 : def.repeatable ? timeline.length : 1;
  return {
    ...def,
    earned,
    earnedAt: earned ? timeline[def.target - 1] : null,
    lastEarnedAt: earned ? (def.repeatable ? timeline[timeline.length - 1] : timeline[def.target - 1]) : null,
    timesEarned,
    progress: Math.min(timeline.length, def.target),
  };
}

function tiers(
  base: { idPrefix: string; category: AchievementCategory },
  levels: Level[],
  unit?: string
): Definition[] {
  return levels.map((l) => ({
    id: `${base.idPrefix}-${l.target}`,
    category: base.category,
    ...l,
    ...(unit && { unit }),
  }));
}

const WORKOUT_TIERS = tiers({ idPrefix: "workouts", category: "Workouts" }, [
  {
    target: 1, name: "Welcome to the Gym, Champ", icon: "🚪", box: "Bronze",
    description: "Log your first workout",
    quip: "You walked through the door. Statistically, most of you don't come back. The viewers are already placing bets.",
  },
  {
    target: 10, name: "Not Dead Yet", icon: "💀", box: "Bronze",
    description: "Log 10 workouts",
    quip: "Ten workouts, zero fatalities. Your survival odds have been upgraded from \"grim\" to \"mildly concerning.\"",
  },
  {
    target: 25, name: "Creature of Habit", icon: "🦎", box: "Silver",
    description: "Log 25 workouts",
    quip: "You've developed a routine. Routines are how predators find you. Just saying.",
  },
  {
    target: 50, name: "Gym Goblin", icon: "👺", box: "Gold",
    description: "Log 50 workouts",
    quip: "You now spend more time near the squat rack than near sunlight. The goblins have accepted you as one of their own.",
  },
  {
    target: 100, name: "Centurion of Iron", icon: "🛡️", box: "Platinum",
    description: "Log 100 workouts",
    quip: "One hundred workouts. The System has run out of sarcastic things to say. That's a lie. But it is impressed. Briefly.",
  },
  {
    target: 150, name: "Officially Pumped (Hans & Franz Approved)", icon: "💪", box: "Legendary",
    description: "Log 150 workouts",
    quip: "Ja! Two very large Austrian gentlemen in very small sweatsuits have reviewed your 150 workouts and agree: you have been sufficiently pumped. You are no longer a flabby little noodle-arm. Hear the System now, flex later.",
  },
  {
    target: 200, name: "The Incredible Bulk", icon: "💚", box: "Legendary",
    description: "Log 200 workouts",
    quip: "Two hundred workouts. Somewhere in 1978, a man covered head to toe in green body paint just nodded at you in slow motion. Please stop ripping your shirts every leg day, champ. The System is not paying for those.",
  },
]);

const STREAK_TIERS = tiers({ idPrefix: "week-streak", category: "Consistency" }, [
  {
    target: 2, name: "Back for More", icon: "🔁", box: "Bronze",
    description: "Lift or do cardio 2 weeks in a row",
    quip: "Most gym rats mysteriously \"get busy\" after week one. You did not. Suspicious.",
  },
  {
    target: 4, name: "The Grind Is Real", icon: "🔥", box: "Silver",
    description: "Lift or do cardio 4 weeks in a row",
    quip: "Four straight weeks. Your couch has filed a missing persons report.",
  },
  {
    target: 12, name: "Unkillable", icon: "⚡", box: "Platinum",
    description: "Lift or do cardio 12 weeks in a row",
    quip: "Twelve consecutive weeks. Rest days are still allowed, you absolute lunatic.",
  },
]);

const PR_TIERS = tiers({ idPrefix: "prs", category: "Strength" }, [
  {
    target: 1, name: "Stronger Than Yesterday", icon: "🏆", box: "Bronze", repeatable: true,
    description: "Beat a previous best on any exercise (earned every PR)",
    quip: "You broke a record. The previous record holder (also you) has been notified and is devastated.",
  },
  {
    target: 10, name: "Record Shredder", icon: "📈", box: "Gold",
    description: "Set 10 personal records",
    quip: "Ten personal records. The barbell has started to fear you. Good. Let it.",
  },
  {
    target: 50, name: "Boss Fight Material", icon: "🐉", box: "Legendary",
    description: "Set 50 personal records",
    quip: "Fifty PRs. You're no longer working out at the gym. You're the beast every other gym rat waits on for the squat rack.",
  },
]);

// Volume tiers count in 1,000 lb steps so the timeline stays a manageable size
const VOLUME_TIERS = tiers({ idPrefix: "volume", category: "Strength" }, [
  {
    target: 10, name: "Elephant Mover", icon: "🐘", box: "Bronze",
    description: "Lift 10,000 lbs total",
    quip: "Ten thousand pounds moved — roughly one adult elephant. Please do not attempt to lift an actual elephant.",
  },
  {
    target: 100, name: "Small Moon", icon: "🌑", box: "Gold",
    description: "Lift 100,000 lbs total",
    quip: "You could have relocated a house. Instead you picked heavy things up and put them back down. Respect.",
  },
  {
    target: 1000, name: "Million Pound Menace", icon: "💎", box: "Legendary",
    description: "Lift 1,000,000 lbs total",
    quip: "One million pounds. The System doesn't have a box big enough for this. Here's a box anyway.",
  },
], "k lbs");

const WEIGH_IN_TIERS = tiers({ idPrefix: "weigh-ins", category: "Body Weight" }, [
  {
    target: 1, name: "Know Thy Stats", icon: "⚖️", box: "Bronze",
    description: "Log your first weigh-in",
    quip: "Every iron warrior needs to know their numbers. Even the ones they'd rather not look at.",
  },
  {
    target: 10, name: "Data Hoarder", icon: "📊", box: "Silver",
    description: "Log 10 weigh-ins",
    quip: "You now have a graph. Graphs go up. Graphs go down. Try not to cry at either.",
  },
]);

const GOAL_WEIGHT: Definition = {
  id: "goal-weight",
  category: "Body Weight",
  name: "Main Quest Complete",
  icon: "🎯",
  box: "Platinum",
  description: "Reach your goal weight",
  quip: "You set a goal and actually hit it. The System ran a betting pool on this. The System lost money.",
  target: 1,
};

const FOOD_TIERS = tiers({ idPrefix: "food-days", category: "Nutrition" }, [
  {
    target: 1, name: "Rations Acquired", icon: "🍎", box: "Bronze",
    description: "Log food for the first time",
    quip: "Did you know food is fuel? The System did. Now you do too.",
  },
  {
    target: 7, name: "Snack Auditor", icon: "🥗", box: "Silver",
    description: "Log food on 7 different days",
    quip: "The System now knows exactly how many snacks you ate this week. It is not judging. (It is judging.)",
  },
  {
    target: 30, name: "Quartermaster", icon: "🧠", box: "Gold",
    description: "Log food on 30 different days",
    quip: "Thirty days of tracking. Your food log is more organized than the gym's dumbbell rack.",
  },
]);

const PROTEIN_TIERS = tiers({ idPrefix: "protein-days", category: "Nutrition" }, [
  {
    target: 1, name: "Gains Fueled", icon: "🍗", box: "Bronze", repeatable: true,
    description: "Hit your daily protein target (earned every day you do)",
    quip: "Protein target hit. Your muscles sent a thank-you card. It's mostly grunting.",
  },
  {
    target: 7, name: "Meat Mountain", icon: "🥩", box: "Silver",
    description: "Hit your protein target on 7 days",
    quip: "Seven days on target. Somewhere, a chicken is very nervous.",
  },
]);

const CARDIO_SESSION: Definition = {
  id: "cardio-sessions-1",
  category: "Cardio",
  name: "Cardio? On Purpose?",
  icon: "🏃",
  box: "Bronze",
  description: "Log a cardio session",
  repeatable: true,
  quip: "You did cardio voluntarily. The System has flagged this as highly unusual behavior for a gym rat.",
  target: 1,
};

// Cardio time tiers count in whole hours
const CARDIO_TIME_TIERS = tiers({ idPrefix: "cardio-hours", category: "Cardio" }, [
  {
    target: 5, name: "Heart of a Champ", icon: "❤️", box: "Silver",
    description: "Log 5 hours of cardio",
    quip: "Five hours of cardio. Your heart is now slightly less annoyed with you.",
  },
  {
    target: 25, name: "Lungs of Steel", icon: "🫁", box: "Gold",
    description: "Log 25 hours of cardio",
    quip: "Twenty-five hours. You can now climb stairs without negotiating with them first.",
  },
  {
    target: 100, name: "Endurance Beast", icon: "🦌", box: "Legendary",
    description: "Log 100 hours of cardio",
    quip: "One hundred hours of cardio. Treadmills across the land whisper your name in fear.",
  },
], "hrs");

const CARDIO_VARIETY: Definition = {
  id: "cardio-types-5",
  category: "Cardio",
  name: "Cardio Connoisseur",
  icon: "🎡",
  box: "Silver",
  description: "Try 5 different types of cardio",
  quip: "Five kinds of cardio. You're not running from your problems, iron warrior — you're cycling, rowing and swimming from them too.",
  target: 5,
};

export async function computeAchievements(userId: string, tzOffset = 0): Promise<Achievement[]> {
  const [setLogs, cardioEntries, weightEntries, foodEntries, profile] = await Promise.all([
    prisma.setLog.findMany({
      where: { exercise: { day: { userId } } },
      orderBy: { date: "asc" },
      select: { exerciseId: true, date: true, weight: true, reps: true, sets: true },
    }),
    prisma.cardioEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true, type: true, minutes: true },
    }),
    prisma.weightEntry.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.foodEntry.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true, protein: true },
    }),
    prisma.profile.findUnique({ where: { userId }, select: { goalWeight: true, proteinTarget: true } }),
  ]);

  // Workouts: distinct local days with at least one logged set
  const workoutDays: Timeline = [...new Set(setLogs.map((l) => localDay(l.date, tzOffset)))];

  // Consistency: the running longest streak of consecutive weeks containing a lifting or
  // cardio session
  const streakTimeline: Timeline = [];
  {
    const activeDays = [
      ...new Set([...workoutDays, ...cardioEntries.map((c) => localDay(c.date, tzOffset))]),
    ].sort();
    let current = 0;
    let prevWeek: string | null = null;
    for (const day of activeDays) {
      const week = weekStart(day);
      if (week === prevWeek) continue;
      current = prevWeek && addDays(prevWeek, 7) === week ? current + 1 : 1;
      if (current > streakTimeline.length) streakTimeline.push(day);
      prevWeek = week;
    }
  }

  // PRs: a set that beats the previous best estimated 1RM on the same exercise (the first
  // set ever logged on an exercise isn't a PR — there was nothing to beat)
  const prTimeline: Timeline = [];
  {
    const bestByExercise = new Map<string, number>();
    for (const log of setLogs) {
      const oneRM = estimated1RM(log.weight, log.reps);
      const prior = bestByExercise.get(log.exerciseId);
      if (prior !== undefined && oneRM > prior) prTimeline.push(localDay(log.date, tzOffset));
      if (prior === undefined || oneRM > prior) bestByExercise.set(log.exerciseId, oneRM);
    }
  }

  // Volume: one timeline entry per 1,000 lbs of weight × reps × sets
  const volumeTimeline: Timeline = [];
  {
    let total = 0;
    for (const log of setLogs) {
      total += log.weight * log.reps * log.sets;
      while (volumeTimeline.length < Math.floor(total / 1000)) {
        volumeTimeline.push(localDay(log.date, tzOffset));
      }
    }
  }

  const cardioSessionTimeline: Timeline = cardioEntries.map((c) => localDay(c.date, tzOffset));

  // Cardio time: one timeline entry per full hour logged
  const cardioHourTimeline: Timeline = [];
  {
    let total = 0;
    for (const c of cardioEntries) {
      total += c.minutes;
      while (cardioHourTimeline.length < Math.floor(total / 60)) {
        cardioHourTimeline.push(localDay(c.date, tzOffset));
      }
    }
  }

  // Cardio variety: the day each new type was first tried
  const cardioTypeTimeline: Timeline = [];
  {
    const seen = new Set<string>();
    for (const c of cardioEntries) {
      const t = c.type.toLowerCase();
      if (!seen.has(t)) {
        seen.add(t);
        cardioTypeTimeline.push(localDay(c.date, tzOffset));
      }
    }
  }

  const weighInTimeline: Timeline = weightEntries.map((e) => localDay(e.date, 0));

  // Goal weight: reached once a weigh-in lands on the far side of the goal from the first
  // weigh-in (works for both losing and gaining goals)
  const goalTimeline: Timeline = [];
  const goal = profile?.goalWeight;
  if (goal != null && weightEntries.length > 1) {
    const start = weightEntries[0].weight;
    const losing = goal < start;
    const hit = weightEntries.slice(1).find((e) => (losing ? e.weight <= goal : e.weight >= goal));
    if (hit && goal !== start) goalTimeline.push(localDay(hit.date, 0));
  }

  const proteinByDay = new Map<string, number>();
  for (const f of foodEntries) {
    const day = localDay(f.date, tzOffset);
    proteinByDay.set(day, (proteinByDay.get(day) ?? 0) + f.protein);
  }
  const foodTimeline: Timeline = [...proteinByDay.keys()];
  const proteinTarget = profile?.proteinTarget;
  const proteinTimeline: Timeline = proteinTarget
    ? [...proteinByDay.entries()].filter(([, grams]) => grams >= proteinTarget).map(([day]) => day)
    : [];

  return [
    ...WORKOUT_TIERS.map((d) => fromTimeline(d, workoutDays)),
    ...STREAK_TIERS.map((d) => fromTimeline(d, streakTimeline)),
    ...PR_TIERS.map((d) => fromTimeline(d, prTimeline)),
    ...VOLUME_TIERS.map((d) => fromTimeline(d, volumeTimeline)),
    fromTimeline(CARDIO_SESSION, cardioSessionTimeline),
    ...CARDIO_TIME_TIERS.map((d) => fromTimeline(d, cardioHourTimeline)),
    fromTimeline(CARDIO_VARIETY, cardioTypeTimeline),
    ...WEIGH_IN_TIERS.map((d) => fromTimeline(d, weighInTimeline)),
    fromTimeline(GOAL_WEIGHT, goalTimeline),
    ...FOOD_TIERS.map((d) => fromTimeline(d, foodTimeline)),
    ...PROTEIN_TIERS.map((d) => fromTimeline(d, proteinTimeline)),
  ];
}
