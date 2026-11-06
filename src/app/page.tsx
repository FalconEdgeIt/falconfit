"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import HydrationCard from "../components/HydrationCard";
import QuickFoodLog from "../components/QuickFoodLog";
import { BOX_STYLES } from "../components/boxStyles";
import { DirectivePanel, GoalTrack, TrainingRecord } from "../components/SystemHud";
import { DEFAULT_WATER_TARGET_ML } from "../lib/hydration";
import { getActivityGrid, getDirective, getWeekStreak, getXp, toLocalDay } from "../lib/hud";
import type { Achievement } from "../lib/achievements";

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

type WorkoutDay = {
  id: string;
  name: string;
};

type Profile = {
  goalWeight: number | null;
  waterTarget: number | null;
};

function buildGoogleCalendarUrl(
  title: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 60
) {
  const start = new Date(`${dateStr}T${timeStr}`);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const formatForGoogle = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const dates = `${formatForGoogle(start)}/${formatForGoogle(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: "Scheduled via FalconFit",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const RECORD_WEEKS = 18;

type HistoryEntry = { date: string; dayName: string };
type CardioEntry = { date: string; minutes: number };

export default function Home() {
  const [today] = useState(() => new Date());
  const [firstName, setFirstName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cardioLog, setCardioLog] = useState<CardioEntry[]>([]);
  const [startWeight, setStartWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [waterTarget, setWaterTarget] = useState(DEFAULT_WATER_TARGET_ML);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState("17:00");

  const [showLogFood, setShowLogFood] = useState(false);
  const [showLogWater, setShowLogWater] = useState(false);

  const [achievements, setAchievements] = useState<Achievement[] | null>(null);

  // Loaded separately from the rest of the dashboard so a failure here doesn't hide the stats
  const loadAchievements = () => {
    fetch(`/api/achievements?tzOffset=${new Date().getTimezoneOffset()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setAchievements(data))
      .catch(() => {});
  };

  useEffect(loadAchievements, []);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => me && setFirstName(me.name.split(" ")[0]))
      .catch(() => {});
  }, []);

  const [cardioWeek, setCardioWeek] = useState<{ minutes: number; sessions: number } | null>(null);

  useEffect(() => {
    fetch("/api/cardio")
      .then((res) => (res.ok ? res.json() : null))
      .then((entries: CardioEntry[] | null) => {
        if (!entries) return;
        setCardioLog(entries);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = entries.filter((e) => new Date(e.date).getTime() >= weekAgo);
        setCardioWeek({ minutes: recent.reduce((sum, e) => sum + e.minutes, 0), sessions: recent.length });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyRes, weightRes, daysRes, profileRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/weight"),
          fetch("/api/workout-days"),
          fetch("/api/profile"),
        ]);

        if (!historyRes.ok || !weightRes.ok || !daysRes.ok || !profileRes.ok) throw new Error();

        const historyData: HistoryEntry[] = await historyRes.json();
        const weightLog: WeightEntry[] = await weightRes.json();
        const workoutDays: WorkoutDay[] = await daysRes.json();
        const profile: Profile = await profileRes.json();

        setHistory(historyData);

        if (weightLog.length > 0) {
          const sorted = [...weightLog].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setCurrentWeight(sorted[0].weight);
          setStartWeight(sorted[sorted.length - 1].weight);
        }

        setGoalWeight(profile.goalWeight);
        setWaterTarget(profile.waterTarget ?? DEFAULT_WATER_TARGET_ML);
        setDays(workoutDays);
        setSelectedDayId(workoutDays[0]?.id || "");
      } catch {
        setError("Couldn't load your dashboard data.");
      } finally {
        setLoaded(true);
      }
    };

    loadData();
  }, []);

  const selectedDay = days.find((d) => d.id === selectedDayId);

  const liftDays = new Set(history.map((h) => toLocalDay(new Date(h.date))));
  const cardioDays = new Set(cardioLog.map((c) => toLocalDay(new Date(c.date))));
  const activeDays = new Set([...liftDays, ...cardioDays]);
  const workoutCount = liftDays.size;

  const { streak, activeThisWeek } = getWeekStreak(activeDays, today);
  const grid = getActivityGrid(liftDays, cardioDays, today, RECORD_WEEKS);
  const lastActive = [...activeDays].sort().at(-1) ?? null;
  const directive = getDirective({
    today,
    days,
    lastDayName: history[0]?.dayName ?? null, // history arrives newest first
    trainedToday: activeDays.has(toLocalDay(today)),
    daysSinceActive: lastActive
      ? Math.round(
          (new Date(`${toLocalDay(today)}T00:00:00`).getTime() - new Date(`${lastActive}T00:00:00`).getTime()) /
            86400000
        )
      : null,
    streak,
    activeThisWeek,
  });
  const xp = getXp(workoutCount, cardioLog.length, achievements ?? []);

  const earnedBadges = (achievements ?? []).filter((a) => a.earned);
  const recentBadges = [...earnedBadges]
    .sort((a, b) => (b.lastEarnedAt ?? "").localeCompare(a.lastEarnedAt ?? ""))
    .slice(0, 3);
  // The locked badge closest to being earned, as a nudge
  const nextBadge = (achievements ?? [])
    .filter((a) => !a.earned)
    .sort((a, b) => b.progress / b.target - a.progress / a.target)[0];

  const calendarUrl = selectedDay
    ? buildGoogleCalendarUrl(
        `FalconFit: ${selectedDay.name} Workout`,
        scheduleDate,
        scheduleTime
      )
    : "";

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Navigation />

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {!loaded ? (
          <div className="bg-gray-800 rounded-2xl h-72 animate-pulse" />
        ) : (
          <DirectivePanel
            name={firstName}
            today={today}
            directive={directive}
            xp={xp}
            onLogFood={() => {
              setShowLogFood(true);
              document.getElementById("quick-actions")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <TrainingRecord
              grid={grid}
              weeks={RECORD_WEEKS}
              streak={streak}
              activeDaysInGrid={grid.filter((d) => d.lifted || d.cardio).length}
            />
          </div>
          <GoalTrack startWeight={startWeight} currentWeight={currentWeight} goalWeight={goalWeight} />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700/70 p-4 lg:p-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Workouts</p>
            <p className="font-display font-extrabold text-4xl lg:text-5xl mt-1 tabular-nums">
              {!loaded ? "..." : workoutCount}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">all time</p>
          </div>
          <a
            href="/workouts"
            className="bg-gray-800 rounded-2xl border border-gray-700/70 p-4 lg:p-5 hover:border-gray-600"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider">Cardio</p>
            <p className="font-display font-extrabold text-4xl lg:text-5xl mt-1 tabular-nums">
              {!cardioWeek
                ? "..."
                : cardioWeek.minutes >= 60
                  ? `${Math.floor(cardioWeek.minutes / 60)}h ${cardioWeek.minutes % 60}m`
                  : `${cardioWeek.minutes}m`}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              last 7 days{cardioWeek ? ` · ${cardioWeek.sessions} session${cardioWeek.sessions === 1 ? "" : "s"}` : ""}
            </p>
          </a>
          <a
            href="/achievements"
            className="bg-gray-800 rounded-2xl border border-gray-700/70 p-4 lg:p-5 hover:border-gray-600"
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider">Badges</p>
            <p className="font-display font-extrabold text-4xl lg:text-5xl mt-1 tabular-nums">
              {achievements ? earnedBadges.length : "..."}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">of {achievements?.length ?? "..."} earned</p>
          </a>
        </div>

        {achievements && (
          <div className="mt-4 bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6">
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
              <h2 className="text-2xl font-bold">Recent Badges</h2>
              <a href="/achievements" className="text-sm text-gray-400 hover:text-red-400">
                {earnedBadges.length} / {achievements.length} earned →
              </a>
            </div>

            {recentBadges.length === 0 ? (
              <p className="text-gray-500 font-mono text-sm">
                No badges yet. The System is disappointed but not surprised. Log a workout, champ.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {recentBadges.map((a) => (
                  <a
                    key={a.id}
                    href="/achievements"
                    title={a.quip}
                    className={`flex items-center gap-3 bg-gray-900/60 border-2 ${BOX_STYLES[a.box].border} rounded-lg p-3 hover:bg-gray-900`}
                  >
                    <span className="text-3xl">{a.icon}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">
                        {a.name}
                        {a.repeatable && a.timesEarned > 1 && (
                          <span className="ml-1 text-green-300 text-xs">✓×{a.timesEarned}</span>
                        )}
                      </span>
                      <span className={`block text-xs ${BOX_STYLES[a.box].text}`}>
                        {a.box} Box
                        {a.lastEarnedAt &&
                          ` · ${new Date(`${a.lastEarnedAt}T00:00:00`).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}`}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}

            {nextBadge && (
              <div className="mt-4 flex items-center gap-3 text-sm">
                <span className="text-gray-400 shrink-0">Next up:</span>
                <span className="grayscale opacity-60">{nextBadge.icon}</span>
                <span className="text-gray-300 shrink-0">{nextBadge.name}</span>
                <span className="text-gray-500 hidden sm:inline truncate">— {nextBadge.description}</span>
                {nextBadge.target > 1 && (
                  <span className="ml-auto text-gray-500 shrink-0">
                    {nextBadge.progress.toLocaleString()} / {nextBadge.target.toLocaleString()}
                    {nextBadge.unit ? ` ${nextBadge.unit}` : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div
          id="quick-actions"
          className="mt-4 bg-gray-800 rounded-2xl border border-gray-700/70 p-5 lg:p-6 scroll-mt-20"
        >
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowScheduler((prev) => !prev)}
              className="bg-red-600 px-5 py-3 rounded-lg"
            >
              📅 Schedule Workout
            </button>
            <button
              onClick={() => setShowLogFood((prev) => !prev)}
              className="bg-red-700 px-5 py-3 rounded-lg"
            >
              🍗 Log Food
            </button>
            <button
              onClick={() => setShowLogWater((prev) => !prev)}
              className="bg-red-800 px-5 py-3 rounded-lg"
            >
              💧 Log Water
            </button>
          </div>

          {showLogFood && <QuickFoodLog onLogged={loadAchievements} />}

          {showLogWater && (
            <HydrationCard
              day={toLocalDay(today)}
              today={toLocalDay(today)}
              target={waterTarget}
              className="mt-6 border border-gray-700 rounded-lg p-4 sm:p-5"
              onChange={loadAchievements}
            />
          )}

          {showScheduler && (
            <div className="mt-6 bg-gray-700 rounded-lg p-5">
              {days.length === 0 ? (
                <p className="text-gray-400">
                  No workout days yet, add one on the Workouts page first.
                </p>
              ) : (
                <div>
                  <div className="flex gap-3 flex-wrap items-center mb-4">
                    <select
                      value={selectedDayId}
                      onChange={(e) => setSelectedDayId(e.target.value)}
                      className="bg-gray-800 p-2 rounded"
                    >
                      {days.map((day) => (
                        <option key={day.id} value={day.id}>
                          {day.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-gray-800 p-2 rounded"
                    />

                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-gray-800 p-2 rounded"
                    />
                  </div>

                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-red-600 px-4 py-2 rounded">Add to Google Calendar</a>
                 </div>
              )}
            </div>
          )}
        </div>

        <a
          href="https://www.falconedgeit.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400"
        >
          <img src="/falconfit-icon.png" alt="" className="h-4 w-auto" />
          Powered by FalconEdge IT
        </a>
      </div>
    </main>
  );
}