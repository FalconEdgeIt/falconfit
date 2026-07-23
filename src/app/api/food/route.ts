import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET all food entries, newest first
export async function GET() {
  const entries = await prisma.foodEntry.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

// POST log a new food entry
export async function POST(request: Request) {
  const body = await request.json();
  const { name, calories, protein, carbs, fat, date } = body;

  if (!name || calories === undefined) {
    return NextResponse.json({ error: "name and calories are required" }, { status: 400 });
  }

  const entry = await prisma.foodEntry.create({
    data: {
      name,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      ...(date && { date: new Date(date) }),
    },
  });

  return NextResponse.json(entry);
}