import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../../lib/authz";

// DELETE a cardio session (the caller's own, or a Member's in the Trainer's group)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const entry = await prisma.cardioEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await resolveTargetUserId(session, entry.userId);
  if (isResponse(owner)) return owner;

  await prisma.cardioEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
