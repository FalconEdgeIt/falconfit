import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../../../lib/authz";

function estimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const body = await request.json();
  const { weight, reps, sets } = body;

  if (weight === undefined || reps === undefined || sets === undefined) {
    return NextResponse.json({ error: "weight, reps, and sets are required" }, { status: 400 });
  }

  const exercise = await prisma.exercise.findUnique({ where: { id }, include: { day: true } });
  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const owner = await resolveTargetUserId(session, exercise.day.userId);
  if (isResponse(owner)) return owner;

  const newOneRM = estimated1RM(weight, reps);
  const priorBestOneRM =
    exercise.bestWeight && exercise.bestReps
      ? estimated1RM(exercise.bestWeight, exercise.bestReps)
      : 0;
  const isNewPR = newOneRM > priorBestOneRM;

  // Record this set in history
  await prisma.setLog.create({
    data: { exerciseId: id, weight, reps, sets },
  });

  // Update last (always) and personal best (only if beaten)
  const updatedExercise = await prisma.exercise.update({
    where: { id },
    data: {
      lastWeight: weight,
      lastReps: reps,
      lastSets: sets,
      ...(isNewPR && {
        bestWeight: weight,
        bestReps: reps,
        bestSets: sets,
      }),
    },
  });

  return NextResponse.json({ exercise: updatedExercise, isNewPR });
}
