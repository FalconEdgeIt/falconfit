import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET all set logs, with exercise name and day name attached, newest first
export async function GET() {
  const logs = await prisma.setLog.findMany({
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