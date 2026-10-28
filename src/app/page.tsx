"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { notifyActivity } from "../components/AchievementToasts";
import { BOX_STYLES } from "../components/boxStyles";
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

export default function Home() {
  const [workoutCount, setWorkoutCount] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
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
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodMessage, setFoodMessage] = useState("");

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
    const loadData = async () => {
      try {
        const [historyRes, weightRes, daysRes, profileRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/weight"),
          fetch("/api/workout-days"),
          fetch("/api/profile"),
        ]);

        if (!historyRes.ok || !weightRes.ok || !daysRes.ok || !profileRes.ok) throw new Error();

        const history: { date: string }[] = await historyRes.json();
        const weightLog: WeightEntry[] = await weightRes.json();
        const workoutDays: WorkoutDay[] = await daysRes.json();
        const profile: Profile = await profileRes.json();

        const uniqueDays = new Set(
          history.map((entry) => new Date(entry.date).toISOString().slice(0, 10))
        );
        setWorkoutCount(uniqueDays.size);

        if (weightLog.length > 0) {
          const sorted = [...weightLog].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setCurrentWeight(sorted[0].weight);
        }

        setGoalWeight(profile.goalWeight);
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

  const handleLogFood = async () => {
    if (!foodName.trim() || !foodCalories) return;

    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName.trim(),
          calories: Number(foodCalories),
          protein: Number(foodProtein) || 0,
          carbs: Number(foodCarbs) || 0,
          fat: Number(foodFat) || 0,
        }),
      });
      if (!res.ok) throw new Error();

      setFoodName("");
      setFoodCalories("");
      setFoodProtein("");
      setFoodCarbs("");
      setFoodFat("");
      setFoodMessage(`Logged "${foodName.trim()}"`);
      notifyActivity();
      loadAchievements();
    } catch {
      setFoodMessage("Couldn't log that food. Try again.");
    }
  };

  const selectedDay = days.find((d) => d.id === selectedDayId);

  const earnedBadges = (achievements ?? []).filter((a) => a.earned);
  const recentBadges = [...earnedBadges]
    .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
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
      <div className="max-w-4xl mx-auto">
        <Navigation />

        <div className="text-center mb-8">
          <img src="/falconfit-logo.png" alt="FalconFit" className="h-40 mx-auto mb-2" />
          <p className="text-gray-300">Your personal fitness tracking dashboard</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Current Weight</h2>
            <p className="text-3xl mt-2">
              {!loaded ? "..." : currentWeight !== null ? `${currentWeight} lbs` : "No data yet"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Goal Weight</h2>
            <p className="text-3xl mt-2">
              {!loaded ? "..." : goalWeight !== null ? `${goalWeight} lbs` : "Not set"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Workouts</h2>
            <p className="text-3xl mt-2">{!loaded ? "..." : workoutCount}</p>
          </div>
        </div>

        {achievements && (
          <div className="mt-8 bg-gray-800 rounded-xl p-6">
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
                      <span className="block font-semibold truncate">{a.name}</span>
                      <span className={`block text-xs ${BOX_STYLES[a.box].text}`}>
                        {a.box} Box
                        {a.earnedAt &&
                          ` · ${new Date(`${a.earnedAt}T00:00:00`).toLocaleDateString(undefined, {
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

        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowScheduler((prev) => !prev)}
              className="bg-red-600 px-5 py-3 rounded-lg"
            >
              📅 Schedule Workout
            </button>
            <button
              onClick={() => {
                setShowLogFood((prev) => !prev);
                setFoodMessage("");
              }}
              className="bg-red-700 px-5 py-3 rounded-lg"
            >
              🍗 Log Food
            </button>
          </div>

          {showLogFood && (
            <div className="mt-6 bg-gray-700 rounded-lg p-5">
              {foodMessage && <p className="text-green-400 text-sm mb-3">{foodMessage}</p>}
              <div className="flex gap-3 flex-wrap mb-2">
                <input
                  type="text"
                  placeholder="Food name"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="bg-gray-800 p-2 rounded flex-1 min-w-[160px]"
                />
                <input
                  type="number"
                  placeholder="Calories"
                  value={foodCalories}
                  onChange={(e) => setFoodCalories(e.target.value)}
                  className="bg-gray-800 p-2 rounded w-28"
                />
                <input
                  type="number"
                  placeholder="Protein (g)"
                  value={foodProtein}
                  onChange={(e) => setFoodProtein(e.target.value)}
                  className="bg-gray-800 p-2 rounded w-28"
                />
                <input
                  type="number"
                  placeholder="Carbs (g)"
                  value={foodCarbs}
                  onChange={(e) => setFoodCarbs(e.target.value)}
                  className="bg-gray-800 p-2 rounded w-28"
                />
                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={foodFat}
                  onChange={(e) => setFoodFat(e.target.value)}
                  className="bg-gray-800 p-2 rounded w-28"
                />
                <button onClick={handleLogFood} className="bg-red-600 px-4 py-2 rounded">
                  Add
                </button>
              </div>
              <a href="/nutrition" className="text-sm text-gray-400 hover:text-red-400">
                View full Nutrition page →
              </a>
            </div>
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

        <a href="https://www.falconedgeit.ca" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800/80 backdrop-blur px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 transition-colors">
          <img src="/falconfit-icon.png" alt="FalconEdge IT" className="h-5 w-auto" />
          Powered by FalconEdge IT
        </a>
      </div>
    </main>
  );
}