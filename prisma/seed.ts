import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";
import { Role } from "../src/generated/prisma/enums";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running the seed script."
    );
  }

  const admin = await prisma.user.findUnique({ where: { email } });

  if (!admin) {
    const created = await prisma.user.create({
      data: {
        email,
        name: "Duncan",
        role: Role.ADMIN,
        passwordHash: await hashPassword(password),
      },
    });
    console.log(`Created Admin user ${created.email}`);
  } else {
    console.log(`Admin user ${admin.email} already exists, skipping creation`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
