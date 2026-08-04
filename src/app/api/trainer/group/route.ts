import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";

// GET the Trainer's own Group (members) plus unassigned Members available to add
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.TRAINER);
  if (forbidden) return forbidden;

  const [group, availableMembers] = await Promise.all([
    prisma.group.findUnique({
      where: { trainerId: session.id },
      select: {
        id: true,
        name: true,
        members: { select: { id: true, name: true, email: true }, orderBy: { name: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: Role.MEMBER, groupId: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ group, availableMembers });
}
