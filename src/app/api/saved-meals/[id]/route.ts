import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, isResponse } from "../../../../lib/authz";

// DELETE a go-to meal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const meal = await prisma.savedMeal.findUnique({ where: { id } });
  if (!meal || meal.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedMeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
