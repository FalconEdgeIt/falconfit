// Weekly group scoring. Points reward showing up rather than how much anyone lifts, so a
// beginner can beat a veteran. Nothing here touches the database, so the page can share it.
export const POINTS = {
  workoutDay: 10,
  cardioMinutesPerPoint: 5,
  cardioDailyCap: 10,
  hydrationDay: 3,
  streakWeek: 1,
  streakCap: 5,
};

export type PersonActivity = {
  id: string;
  name: string;
  isTrainer: boolean;
  liftDays: Set<string>;
  cardioByDay: Map<string, number>; // minutes
  waterByDay: Map<string, number>; // ml
  waterTarget: number;
};

export type BoardRow = {
  id: string;
  name: string;
  isTrainer: boolean;
  rank: number;
  points: number;
  workouts: number;
  cardioMinutes: number;
  hydrationDays: number;
  streak: number;
};

export function localDay(date: Date, tzOffset: number) {
  return new Date(date.getTime() - tzOffset * 60000).toISOString().slice(0, 10);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing the given YYYY-MM-DD
export function weekStart(day: string) {
  const shift = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(day, -shift);
}

function daysOfWeek(start: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function isActiveWeek(person: PersonActivity, start: string) {
  return daysOfWeek(start).some((day) => person.liftDays.has(day) || person.cardioByDay.has(day));
}

// Weeks in a row with a workout or cardio, ending at this week. Zero if this week is empty.
function streakAt(person: PersonActivity, start: string) {
  let streak = 0;
  for (let week = start; isActiveWeek(person, week); week = addDays(week, -7)) streak += 1;
  return streak;
}

function scoreWeek(person: PersonActivity, start: string) {
  const days = daysOfWeek(start);
  const workouts = days.filter((day) => person.liftDays.has(day)).length;
  const cardioPerDay = days.map((day) => person.cardioByDay.get(day) ?? 0);
  const hydrationDays = days.filter((day) => (person.waterByDay.get(day) ?? 0) >= person.waterTarget).length;
  const streak = streakAt(person, start);

  const cardioPoints = cardioPerDay.reduce(
    (sum, minutes) => sum + Math.min(POINTS.cardioDailyCap, Math.floor(minutes / POINTS.cardioMinutesPerPoint)),
    0
  );

  return {
    workouts,
    cardioMinutes: cardioPerDay.reduce((sum, minutes) => sum + minutes, 0),
    hydrationDays,
    streak,
    points:
      workouts * POINTS.workoutDay +
      cardioPoints +
      hydrationDays * POINTS.hydrationDay +
      Math.min(streak, POINTS.streakCap) * POINTS.streakWeek,
  };
}

// The whole group for one week, highest first. Tied people share a rank.
export function rankWeek(people: PersonActivity[], start: string): BoardRow[] {
  const scored = people
    .map(({ id, name, isTrainer, ...activity }) => ({
      id,
      name,
      isTrainer,
      ...scoreWeek({ id, name, isTrainer, ...activity }, start),
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return scored.map((row) => ({
    ...row,
    rank: scored.findIndex((other) => other.points === row.points) + 1,
  }));
}

// Everyone tied for first in a week. A week nobody scored in has no Champ.
export function champsOf(people: PersonActivity[], start: string) {
  return rankWeek(people, start).filter((row) => row.rank === 1 && row.points > 0);
}

export function previousWeek(start: string) {
  return addDays(start, -7);
}

// The Sundays of each finished week this person won, oldest first
export function champTimeline(people: PersonActivity[], userId: string, currentWeek: string) {
  const days = people.flatMap((p) => [...p.liftDays, ...p.cardioByDay.keys(), ...p.waterByDay.keys()]).sort();
  if (days.length === 0) return [];

  const timeline: string[] = [];
  for (let week = weekStart(days[0]); week < currentWeek; week = addDays(week, 7)) {
    if (champsOf(people, week).some((row) => row.id === userId)) timeline.push(addDays(week, 6));
  }
  return timeline;
}
