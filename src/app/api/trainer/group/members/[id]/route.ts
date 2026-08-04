import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../../../lib/authz";
import { Role } from "../../../../../../generated/prisma/enums";

// DELETE remove a Member from the Trainer's own Group (they become unassigned)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.TRAINER);
  if (forbidden) return forbidden;

  const { id } = await params;
  const group = await prisma.group.findUnique({ where: { trainerId: session.id } });
  if (!group) {
    return NextResponse.json({ error: "You don't lead a Group yet" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.groupId !== group.id) {
    return NextResponse.json({ error: "That Member isn't in your Group" }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { groupId: null } });
  return NextResponse.json({ success: true });
}
