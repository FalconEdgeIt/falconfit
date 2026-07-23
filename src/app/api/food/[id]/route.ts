import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// DELETE a food entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.foodEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
