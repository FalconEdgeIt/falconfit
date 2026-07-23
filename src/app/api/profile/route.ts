import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET the profile - creates a default empty one if it doesn't exist yet
export async function GET() {
  let profile = await prisma.profile.findUnique({
    where: { id: "singleton" },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { id: "singleton" },
    });
  }

  return NextResponse.json(profile);
}

// PATCH update any subset of profile fields
export async function PATCH(request: Request) {
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
    where: { id: "singleton" },
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
      id: "singleton",
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