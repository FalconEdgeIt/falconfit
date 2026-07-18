import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// POST create a new exercise under a workout day
export async function POST(request: Request) {
  const body = await request.json();
  const { name, dayId } = body;

  if (!name || !dayId) {
    return NextResponse.json({ error: "name and dayId are required" }, { status: 400 });
  }

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