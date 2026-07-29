import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";

// GET all weight entries, sorted oldest to newest (good for graphing)
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const entries = await prisma.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(entries);
}

// POST log a weight entry for the caller - overwrites any existing entry for the same date.
// Always logs for the caller themselves (Trainers cannot log a Member's body weight for them).
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const body = await request.json();
  const { date, weight } = body;

  if (!date || weight === undefined) {
    return NextResponse.json({ error: "date and weight are required" }, { status: 400 });
  }

  // Normalize to midnight UTC-safe local date so "same day" comparisons work
  const entryDate = new Date(`${date}T00:00:00`);

  const entry = await prisma.weightEntry.upsert({
    where: { userId_date: { userId: session.id, date: entryDate } },
    update: { weight },
    create: { userId: session.id, date: entryDate, weight },
  });

  return NextResponse.json(entry);
}
