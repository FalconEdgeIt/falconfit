import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../../lib/authz";
import { Role } from "../../../../../generated/prisma/enums";
import { hashPassword } from "../../../../../lib/auth";

// PATCH update a user's name/email/password/role/group
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, include: { ledGroup: true } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, password, role, groupId, disabled } = body;

  if (disabled === true) {
    if (id === session.id) {
      return NextResponse.json({ error: "You can't disable your own account" }, { status: 400 });
    }
    if (target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN, disabled: false } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't disable the last remaining Admin" }, { status: 400 });
      }
    }
  }

  if (role !== undefined && role !== target.role) {
    if (id === session.id) {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 400 });
    }
    if (target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Can't remove the last remaining Admin" }, { status: 400 });
      }
    }
    if (target.role === Role.TRAINER && target.ledGroup) {
      return NextResponse.json(
        { error: "This user leads a Group — reassign or delete that Group first" },
        { status: 400 }
      );
    }
    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: String(email).toLowerCase() }),
        ...(password && { passwordHash: await hashPassword(password), passwordResetRequestedAt: null }),
        ...(role !== undefined && { role }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(disabled !== undefined && { disabled }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        groupId: true,
        disabled: true,
        passwordResetRequestedAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }
    throw err;
  }
}

// DELETE a user (and all their personal data, via cascade)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, include: { ledGroup: true } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't delete the last remaining Admin" }, { status: 400 });
    }
  }

  if (target.ledGroup) {
    return NextResponse.json(
      { error: "This user leads a Group — reassign or delete that Group first" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
