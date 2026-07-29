import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, isResponse } from "../../../../lib/authz";

// DELETE a food entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const entry = await prisma.foodEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.foodEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
