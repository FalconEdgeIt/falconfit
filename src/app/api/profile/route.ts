import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser, isResponse } from "../../../lib/authz";

// GET the caller's profile - creates a default empty one if it doesn't exist yet
export async function GET() {
  const session = await requireUser();
  if (isResponse(session)) return session;

  let profile = await prisma.profile.findUnique({
    where: { userId: session.id },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: session.id },
    });
  }

  return NextResponse.json(profile);
}

// PATCH update any subset of the caller's profile fields
export async function PATCH(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const body = await request.json();
  const {
    goalWeight,
    birthdate,
    heightInches,
    sex,
    calorieTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
  } = body;

  const profile = await prisma.profile.upsert({
    where: { userId: session.id },
    update: {
      ...(goalWeight !== undefined && { goalWeight }),
      ...(birthdate !== undefined && { birthdate: birthdate ? new Date(birthdate) : null }),
      ...(heightInches !== undefined && { heightInches }),
      ...(sex !== undefined && { sex }),
      ...(calorieTarget !== undefined && { calorieTarget }),
      ...(proteinTarget !== undefined && { proteinTarget }),
      ...(carbTarget !== undefined && { carbTarget }),
      ...(fatTarget !== undefined && { fatTarget }),
    },
    create: {
      userId: session.id,
      goalWeight,
      birthdate: birthdate ? new Date(birthdate) : null,
      heightInches,
      sex,
      calorieTarget,
      proteinTarget,
      carbTarget,
      fatTarget,
    },
  });

  return NextResponse.json(profile);
}
