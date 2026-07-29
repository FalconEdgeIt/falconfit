import { NextResponse } from "next/server";
import { getSession, type Session } from "./auth";
import { Role } from "../generated/prisma/enums";
import { prisma } from "./prisma";

// Route Handler guard — returns the session, or a 401 response to return early with.
export async function requireUser(): Promise<Session | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return session;
}

export function requireRole(session: Session, role: Role): NextResponse | null {
  if (session.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

// Resolves which user's data a request should operate on. Defaults to the caller.
// Trainers may pass ?userId=<memberId> to act on behalf of a Member in their Group.
export async function resolveTargetUserId(
  session: Session,
  requestedUserId: string | null
): Promise<string | NextResponse> {
  if (!requestedUserId || requestedUserId === session.id) {
    return session.id;
  }

  if (session.role !== Role.TRAINER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const group = await prisma.group.findUnique({
    where: { trainerId: session.id },
    include: { members: { select: { id: true } } },
  });

  const isMember = group?.members.some((m) => m.id === requestedUserId) ?? false;
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return requestedUserId;
}
