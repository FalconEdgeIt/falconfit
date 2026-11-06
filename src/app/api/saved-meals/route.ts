import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, isResponse } from "../../../lib/authz";

// GET the caller's go-to meals, by name
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const meals = await prisma.savedMeal.findMany({
    where: { userId: session.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(meals);
}

// POST save a new go-to meal
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { name, calories, protein, carbs, fat } = await request.json();

  if (typeof name !== "string" || !name.trim() || calories === undefined) {
    return NextResponse.json({ error: "name and calories are required" }, { status: 400 });
  }

  const meal = await prisma.savedMeal.create({
    data: {
      name: name.trim(),
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      userId: session.id,
    },
  });

  return NextResponse.json(meal);
}
