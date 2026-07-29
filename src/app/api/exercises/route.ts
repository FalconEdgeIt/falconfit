import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";

// POST create a new exercise under a workout day
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const body = await request.json();
  const { name, dayId } = body;

  if (!name || !dayId) {
    return NextResponse.json({ error: "name and dayId are required" }, { status: 400 });
  }

  const day = await prisma.workoutDay.findUnique({ where: { id: dayId } });
  if (!day) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await resolveTargetUserId(session, day.userId);
  if (isResponse(owner)) return owner;

  const exerciseCount = await prisma.exercise.count({ where: { dayId } });

  const newExercise = await prisma.exercise.create({
    data: {
      name,
      dayId,
      order: exerciseCount,
    },
  });

  return NextResponse.json(newExercise);
}
