import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, isResponse } from "../../../lib/authz";
import { Role } from "../../../generated/prisma/enums";

export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      group: { select: { name: true } },
      ledGroup: {
        select: {
          name: true,
          members: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    groupName: user.group?.name ?? null,
    members: user.role === Role.TRAINER ? user.ledGroup?.members ?? [] : undefined,
  });
}
