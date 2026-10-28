import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";

// GET cardio sessions (for the caller, or ?userId= a Member in the Trainer's group), newest first
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const entries = await prisma.cardioEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

// POST log a cardio session (for the caller, or ?userId= a Member in the Trainer's group)
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const body = await request.json();
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const minutes = Math.round(Number(body.minutes));

  if (!type || !Number.isFinite(minutes) || minutes <= 0) {
    return NextResponse.json({ error: "type and a positive number of minutes are required" }, { status: 400 });
  }

  // A plain YYYY-MM-DD is stored at midday UTC so it reads as the same calendar day in any
  // North American timezone; with no date, the session is logged as now.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? new Date(`${body.date}T12:00:00Z`) : new Date();

  const entry = await prisma.cardioEntry.create({
    data: { type, minutes, date, userId },
  });
  return NextResponse.json(entry);
}
