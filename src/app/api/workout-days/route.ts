import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";

// GET all workout days (for the caller, or ?userId= a Member in the Trainer's group)
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const days = await prisma.workoutDay.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
  });
  return NextResponse.json(days);
}

// POST create a new workout day
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const dayCount = await prisma.workoutDay.count({ where: { userId } });

  const newDay = await prisma.workoutDay.create({
    data: {
      name,
      order: dayCount,
      userId,
    },
    include: {
      exercises: true,
    },
  });

  return NextResponse.json(newDay);
}
