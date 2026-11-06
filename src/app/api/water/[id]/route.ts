import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, isResponse } from "../../../../lib/authz";

// DELETE a water entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const entry = await prisma.waterEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.waterEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
