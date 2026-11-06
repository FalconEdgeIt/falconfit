import { NextResponse } from "next/server";
import { requireUser, isResponse } from "../../../lib/authz";
import { champsOf, localDay, previousWeek, rankWeek, weekStart } from "../../../lib/leaderboard";
import { loadGroupActivity } from "../../../lib/leaderboardData";

// GET this week's board for the caller's group. It only carries activity counts: never
// emails, body weight, or food details, because every member can see it.
export async function GET(request: Request) {
  const session = await requireUser();
  if (isResponse(session)) return session;

  const { searchParams } = new URL(request.url);
  const tzOffset = Number(searchParams.get("tzOffset")) || 0;

  const data = await loadGroupActivity(session.id, tzOffset);
  if (!data) return NextResponse.json({ groupName: null });

  const week = weekStart(localDay(new Date(), tzOffset));

  return NextResponse.json({
    groupName: data.groupName,
    weekStart: week,
    viewerId: session.id,
    rows: rankWeek(data.people, week),
    lastChamps: champsOf(data.people, previousWeek(week)).map((row) => row.name),
  });
}
