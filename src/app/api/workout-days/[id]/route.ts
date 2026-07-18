import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// PATCH - rename a day, or update its order
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.workoutDay.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE a day (and its exercises, via cascade)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workoutDay.delete({ where: { id } });
  return NextResponse.json({ success: true });
}