import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireCoach, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";
import { buildCheckIn, type FoodDay, type MemberCheckIn } from "../../../../lib/checkIn";
import { localDay } from "../../../../lib/leaderboard";
import { loadGroupActivity } from "../../../../lib/leaderboardData";

export type MemberCardio = {
  weekMinutes: number;
  weekSessions: number;
  lastDate: string | null;
  lastType: string | null;
};

// GET the Trainer's own Group (members) plus unassigned Members available to add, a cardio
// summary per member (last 7 days, plus their most recent session), and each member's check-in
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireCoach(session);
  if (forbidden) return forbidden;

  const [group, availableMembers] = await Promise.all([
    prisma.group.findUnique({
      where: { trainerId: session.id },
      select: {
        id: true,
        name: true,
        members: { select: { id: true, name: true, email: true }, orderBy: { name: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.MEMBER, groupId: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const memberIds = group?.members.map((m) => m.id) ?? [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const tzOffset = Number(new URL(request.url).searchParams.get("tzOffset")) || 0;

  const [weekEntries, latestEntries, activity, foodEntries, profiles] = await Promise.all([
    prisma.cardioEntry.findMany({
      where: { userId: { in: memberIds }, date: { gte: weekAgo } },
      select: { userId: true, minutes: true },
    }),
    prisma.cardioEntry.findMany({
      where: { userId: { in: memberIds } },
      orderBy: { date: "desc" },
      distinct: ["userId"],
      select: { userId: true, date: true, type: true },
    }),
    loadGroupActivity(session.id, tzOffset),
    prisma.foodEntry.findMany({
      where: { userId: { in: memberIds } },
      select: { userId: true, date: true, calories: true, protein: true },
    }),
    prisma.profile.findMany({
      where: { userId: { in: memberIds } },
      select: { userId: true, calorieTarget: true, proteinTarget: true },
    }),
  ]);

  const cardio: Record<string, MemberCardio> = {};
  for (const id of memberIds) {
    cardio[id] = { weekMinutes: 0, weekSessions: 0, lastDate: null, lastType: null };
  }
  for (const e of weekEntries) {
    cardio[e.userId].weekMinutes += e.minutes;
    cardio[e.userId].weekSessions += 1;
  }
  for (const e of latestEntries) {
    cardio[e.userId].lastDate = e.date.toISOString();
    cardio[e.userId].lastType = e.type;
  }

  const foodByMember = new Map<string, Map<string, FoodDay>>();
  for (const f of foodEntries) {
    const days = foodByMember.get(f.userId) ?? new Map<string, FoodDay>();
    const day = localDay(f.date, tzOffset);
    const total = days.get(day) ?? { calories: 0, protein: 0 };
    days.set(day, { calories: total.calories + f.calories, protein: total.protein + f.protein });
    foodByMember.set(f.userId, days);
  }

  const today = localDay(new Date(), tzOffset);
  const checkIn: Record<string, MemberCheckIn> = {};
  for (const person of activity?.people ?? []) {
    if (person.isTrainer) continue;
    const targets = profiles.find((p) => p.userId === person.id);
    checkIn[person.id] = buildCheckIn(
      person,
      foodByMember.get(person.id) ?? new Map(),
      { calorieTarget: targets?.calorieTarget ?? null, proteinTarget: targets?.proteinTarget ?? null },
      today
    );
  }

  return NextResponse.json({ group, availableMembers, cardio, checkIn });
}
