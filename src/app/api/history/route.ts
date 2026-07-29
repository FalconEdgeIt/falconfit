import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";

// GET all set logs (for the caller, or ?userId= a Member in the Trainer's group),
// with exercise name and day name attached, newest first
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const logs = await prisma.setLog.findMany({
    where: { exercise: { day: { userId } } },
    orderBy: { date: "desc" },
    include: {
      exercise: {
        include: {
          day: true,
        },
      },
    },
  });

  // Flatten the shape so the frontend doesn't need to dig through nested objects
  const flattened = logs.map((log) => ({
    id: log.id,
    date: log.date,
    weight: log.weight,
    reps: log.reps,
    sets: log.sets,
    exerciseId: log.exerciseId,
    exerciseName: log.exercise.name,
    dayName: log.exercise.day.name,
  }));

  return NextResponse.json(flattened);
}
