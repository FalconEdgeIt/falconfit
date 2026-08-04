import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../../lib/authz";
import { Role } from "../../../../../generated/prisma/enums";

// POST send a copy of one of the Trainer's own workout days (name + exercise names/order,
// not personal weight/rep/PR history) to one or more Members in their Group.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.TRAINER);
  if (forbidden) return forbidden;

  const { id } = await params;
  const day = await prisma.workoutDay.findUnique({
    where: { id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  if (!day) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (day.userId !== session.id) {
    return NextResponse.json({ error: "You can only send your own workout days" }, { status: 403 });
  }

  const body = await request.json();
  const memberIds: unknown = body.memberIds;
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "memberIds is required" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({
    where: { trainerId: session.id },
    include: { members: { select: { id: true } }, trainer: { select: { name: true } } },
  });
  const validIds = new Set(group?.members.map((m) => m.id) ?? []);
  const targetIds = [...new Set(memberIds)].filter((memberId): memberId is string => validIds.has(memberId as string));

  if (targetIds.length === 0) {
    return NextResponse.json({ error: "No valid Members selected" }, { status: 400 });
  }

  await Promise.all(
    targetIds.map(async (memberId) => {
      const dayCount = await prisma.workoutDay.count({ where: { userId: memberId } });
      await prisma.workoutDay.create({
        data: {
          name: day.name,
          order: dayCount,
          userId: memberId,
          fromTrainerName: group?.trainer.name,
          exercises: {
            create: day.exercises.map((ex) => ({ name: ex.name, order: ex.order })),
          },
        },
      });
    })
  );

  return NextResponse.json({ sentTo: targetIds.length });
}
