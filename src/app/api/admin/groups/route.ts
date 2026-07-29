import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";

// GET all groups
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      trainer: { select: { id: true, name: true } },
      members: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  return NextResponse.json(groups);
}

// POST create a new group
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, trainerId } = body;

  if (!name || !trainerId) {
    return NextResponse.json({ error: "name and trainerId are required" }, { status: 400 });
  }

  const trainer = await prisma.user.findUnique({ where: { id: trainerId }, include: { ledGroup: true } });
  if (!trainer || trainer.role !== Role.TRAINER) {
    return NextResponse.json({ error: "trainerId must belong to a Trainer" }, { status: 400 });
  }
  if (trainer.ledGroup) {
    return NextResponse.json({ error: "That Trainer already leads a Group" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: { name, trainerId },
    include: {
      trainer: { select: { id: true, name: true } },
      members: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(group);
}
