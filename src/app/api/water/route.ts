import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, isResponse } from "../../../lib/authz";

// GET all water entries for the caller, newest first
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const entries = await prisma.waterEntry.findMany({
    where: { userId: session.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(entries);
}

// POST log water in ml
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { amount, date } = await request.json();
  const ml = Math.round(Number(amount));

  if (!Number.isFinite(ml) || ml <= 0 || ml > 5000) {
    return NextResponse.json({ error: "amount must be between 1 and 5000 ml" }, { status: 400 });
  }

  const entry = await prisma.waterEntry.create({
    data: {
      amount: ml,
      userId: session.id,
      ...(date && { date: new Date(date) }),
    },
  });

  return NextResponse.json(entry);
}
