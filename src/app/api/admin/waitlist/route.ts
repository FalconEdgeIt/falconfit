import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";

// GET everyone on the coach waitlist, newest first
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const entries = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(entries);
}
