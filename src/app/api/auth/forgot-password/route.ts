import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Flags the account for an admin to reset — no email is sent.
export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetRequestedAt: new Date() },
    });
  }

  // Same response whether or not the account exists, so this can't be used to enumerate emails.
  return NextResponse.json({ success: true });
}
