import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, resolveTargetUserId, isResponse } from "../../../../lib/authz";

async function authorizeDay(session: Awaited<ReturnType<typeof requireUser>>, dayId: string) {
  if (isResponse(session)) return session;

  const day = await prisma.workoutDay.findUnique({ where: { id: dayId } });
  if (!day) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await resolveTargetUserId(session, day.userId);
  if (isResponse(owner)) return owner;

  return day;
}

// PATCH - rename a day, or update its order
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const day = await authorizeDay(session, id);
  if (isResponse(day)) return day;

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
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { id } = await params;
  const day = await authorizeDay(session, id);
  if (isResponse(day)) return day;

  await prisma.workoutDay.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
