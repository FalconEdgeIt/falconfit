import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET all weight entries, sorted oldest to newest (good for graphing)
export async function GET() {
  const entries = await prisma.weightEntry.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(entries);
}

// POST log a weight entry - overwrites any existing entry for the same date
export async function POST(request: Request) {
  const body = await request.json();
  const { date, weight } = body;

  if (!date || weight === undefined) {
    return NextResponse.json({ error: "date and weight are required" }, { status: 400 });
  }

  // Normalize to midnight UTC-safe local date so "same day" comparisons work
  const entryDate = new Date(`${date}T00:00:00`);

  const entry = await prisma.weightEntry.upsert({
    where: { date: entryDate },
    update: { weight },
    create: { date: entryDate, weight },
  });

  return NextResponse.json(entry);
}