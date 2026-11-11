import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI commands (db push, migrate, studio, seed) read .env.development only, never .env,
// and it wins over any DATABASE_URL already set in the shell, so they can't reach production.
// On Vercel there's no such file: DATABASE_URL comes from the project settings, and
// `prisma generate` in the build doesn't connect to a database at all.
config({ path: ".env.development", override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
