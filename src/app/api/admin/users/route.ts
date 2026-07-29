import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser, requireRole, isResponse } from "../../../../lib/authz";
import { Role } from "../../../../generated/prisma/enums";
import { hashPassword } from "../../../../lib/auth";

// GET all users
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      groupId: true,
      group: { select: { id: true, name: true } },
      ledGroup: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(users);
}

// POST create a new user
export async function POST(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;
  const forbidden = requireRole(session, Role.ADMIN);
  if (forbidden) return forbidden;

  const body = await request.json();
  const { name, email, password, role, groupId } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
  }

  if (role && !Object.values(Role).includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: String(email).toLowerCase(),
        passwordHash,
        role: role || Role.MEMBER,
        groupId: role === Role.MEMBER ? groupId || null : null,
      },
      select: { id: true, name: true, email: true, role: true, groupId: true },
    });
    return NextResponse.json(user);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }
    throw err;
  }
}
