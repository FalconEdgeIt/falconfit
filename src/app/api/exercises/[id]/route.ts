import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function estimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

// PATCH - rename or reorder an exercise
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.exercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE an exercise
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ success: true });
}