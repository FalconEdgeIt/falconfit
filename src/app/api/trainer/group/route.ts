import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";

export type MemberCardio = {
  weekMinutes: number;
  weekSessions: number;
  lastDate: string | null;
  lastType: string | null;
};

// GET the Trainer's own Group (members) plus unassigned Members available to add, and a
// cardio summary per member (last 7 days, plus their most recent session)
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.TRAINER);
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

  const [weekEntries, latestEntries] = await Promise.all([
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

  return NextResponse.json({ group, availableMembers, cardio });
}
