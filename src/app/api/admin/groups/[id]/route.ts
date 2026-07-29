import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../../lib/authz";
import { Role } from "../../../../../generated/prisma/enums";

// PATCH rename a group or reassign its trainer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const { name, trainerId } = body;

  if (trainerId !== undefined) {
    const trainer = await prisma.user.findUnique({ where: { id: trainerId }, include: { ledGroup: true } });
    if (!trainer || trainer.role !== Role.TRAINER) {
      return NextResponse.json({ error: "trainerId must belong to a Trainer" }, { status: 400 });
    }
    if (trainer.ledGroup && trainer.ledGroup.id !== id) {
      return NextResponse.json({ error: "That Trainer already leads a Group" }, { status: 400 });
    }
  }

  const updated = await prisma.group.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(trainerId !== undefined && { trainerId }),
    },
    include: {
      trainer: { select: { id: true, name: true } },
      members: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE a group (members' groupId is cleared automatically)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const { id } = await params;
  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
