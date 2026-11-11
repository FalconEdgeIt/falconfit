import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { CLIENT_COUNTS } from "../../../lib/waitlist";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST join the coach waitlist. Public, since visitors aren't signed in.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Bots fill every field, people never see this one. Pretend it worked so they move on.
  if (body.website) return NextResponse.json({ success: true });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const business = typeof body.business === "string" ? body.business.trim() : "";
  const clientCount = CLIENT_COUNTS.includes(body.clientCount) ? body.clientCount : null;

  if (!name || name.length > 100) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (business.length > 120) {
    return NextResponse.json({ error: "Business name is too long." }, { status: 400 });
  }

  // Signing up twice is fine: the first entry stands, and nobody learns who's already on the list
  const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
  if (!existing) {
    await prisma.waitlistEntry.create({
      data: { name, email, business: business || null, clientCount },
    });
  }

  return NextResponse.json({ success: true });
}
