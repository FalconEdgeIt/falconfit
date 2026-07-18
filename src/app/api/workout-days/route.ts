import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET all workout days with their exercises, ordered correctly
export async function GET() {
  const days = await prisma.workoutDay.findMany({
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
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const dayCount = await prisma.workoutDay.count();

  const newDay = await prisma.workoutDay.create({
    data: {
      name,
      order: dayCount,
    },
    include: {
      exercises: true,
    },
  });

  return NextResponse.json(newDay);
}