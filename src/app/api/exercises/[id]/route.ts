import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../../lib/authz";

async function authorizeExercise(session: Awaited<ReturnType<typeof requireUser>>, exerciseId: string) {
  if (isResponse(session)) return session;

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { day: true },
  });
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await resolveTargetUserId(session, exercise.day.userId);
  if (isResponse(owner)) return owner;

  return exercise;
}

// PATCH - rename or reorder an exercise
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const exercise = await authorizeExercise(session, id);
  if (isResponse(exercise)) return exercise;

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
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const exercise = await authorizeExercise(session, id);
  if (isResponse(exercise)) return exercise;

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
