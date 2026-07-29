import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, isResponse } from "../../../lib/authz";

// GET all food entries for the caller, newest first
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const entries = await prisma.foodEntry.findMany({
    where: { userId: session.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

// POST log a new food entry
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

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
      userId: session.id,
      ...(date && { date: new Date(date) }),
    },
  });

  return NextResponse.json(entry);
}
