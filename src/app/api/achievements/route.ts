import { NextResponse } from "next/server";
import { requireUser, resolveTargetUserId, isResponse } from "../../../lib/authz";
import { computeAchievements } from "../../../lib/achievements";

// GET achievements (for the caller, or ?userId= a Member in the Trainer's group).
// ?tzOffset= is the browser's getTimezoneOffset(), so "days" match the user's local calendar.
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const userId = await resolveTargetUserId(session, searchParams.get("userId"));
  if (isResponse(userId)) return userId;

  const tzOffset = Number(searchParams.get("tzOffset"));
  const offset = Number.isFinite(tzOffset) && Math.abs(tzOffset) <= 14 * 60 ? tzOffset : 0;

  return NextResponse.json(await computeAchievements(userId, offset));
}
