import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../../lib/authz";
import { Role } from "../../../../../generated/prisma/enums";

// POST add an unassigned Member to the Trainer's own Group
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.TRAINER);
  if (forbidden) return forbidden;

  const group = await prisma.group.findUnique({ where: { trainerId: session.id } });
  if (!group) {
    return NextResponse.json({ error: "You don't lead a Group yet" }, { status: 400 });
  }

  const body = await request.json();
  const { memberId } = body;
  if (!memberId || typeof memberId !== "string") {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: memberId } });
  if (!target || target.role !== Role.MEMBER) {
    return NextResponse.json({ error: "memberId must belong to a Member" }, { status: 400 });
  }
  if (target.groupId) {
    return NextResponse.json({ error: "That Member is already in a Group" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: memberId },
    data: { groupId: group.id },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(updated);
}
