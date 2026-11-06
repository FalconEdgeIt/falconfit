import { prisma } from "./prisma";
import { DEFAULT_WATER_TARGET_ML } from "./hydration";
import { localDay, type PersonActivity } from "./leaderboard";

function addTo(map: Map<string, number>, day: string, amount: number) {
  map.set(day, (map.get(day) ?? 0) + amount);
}

// Everyone in the caller's group with their activity by day, or null if they aren't in one.
// Trainers compete alongside their members. Blocked accounts are left off the board.
export async function loadGroupActivity(userId: string, tzOffset: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true, ledGroup: { select: { id: true } } },
  });
  const groupId = user?.groupId ?? user?.ledGroup?.id;
  if (!groupId) return null;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      name: true,
      trainer: { select: { id: true, name: true, disabled: true } },
      members: { select: { id: true, name: true, disabled: true } },
    },
  });
  if (!group) return null;

  const roster = [{ ...group.trainer, isTrainer: true }, ...group.members.map((m) => ({ ...m, isTrainer: false }))]
    .filter((person) => !person.disabled);
  const ids = roster.map((person) => person.id);

  const [setLogs, cardioEntries, waterEntries, profiles] = await Promise.all([
    prisma.setLog.findMany({
      where: { exercise: { day: { userId: { in: ids } } } },
      select: { date: true, exercise: { select: { day: { select: { userId: true } } } } },
    }),
    prisma.cardioEntry.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, date: true, minutes: true },
    }),
    prisma.waterEntry.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, date: true, amount: true },
    }),
    prisma.profile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, waterTarget: true },
    }),
  ]);

  const byId = new Map<string, PersonActivity>(
    roster.map(({ id, name, isTrainer }) => [
      id,
      {
        id,
        name,
        isTrainer,
        liftDays: new Set(),
        cardioByDay: new Map(),
        waterByDay: new Map(),
        waterTarget: DEFAULT_WATER_TARGET_ML,
      },
    ])
  );

  for (const log of setLogs) byId.get(log.exercise.day.userId)?.liftDays.add(localDay(log.date, tzOffset));
  for (const c of cardioEntries) {
    const person = byId.get(c.userId);
    if (person) addTo(person.cardioByDay, localDay(c.date, tzOffset), c.minutes);
  }
  for (const w of waterEntries) {
    const person = byId.get(w.userId);
    if (person) addTo(person.waterByDay, localDay(w.date, tzOffset), w.amount);
  }
  for (const { userId: id, waterTarget } of profiles) {
    const person = byId.get(id);
    if (person && waterTarget) person.waterTarget = waterTarget;
  }

  return { groupName: group.name, people: [...byId.values()] };
}
