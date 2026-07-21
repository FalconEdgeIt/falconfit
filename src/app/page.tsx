"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

type WorkoutDay = {
  id: string;
  name: string;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyRes, weightRes, daysRes] = await Promise.all([
          fetch("/api/history"),
          fetch("/api/weight"),
          fetch("/api/workout-days"),
        ]);

        if (!historyRes.ok || !weightRes.ok || !daysRes.ok) throw new Error();

        const history: { date: string }[] = await historyRes.json();
        const weightLog: WeightEntry[] = await weightRes.json();
        const workoutDays: WorkoutDay[] = await daysRes.json();

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
        <h1 className="text-4xl font-bold mb-6">FalconFit</h1>
        <p className="text-gray-300 mb-8">Your personal fitness tracking dashboard</p>

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
            <p className="text-3xl mt-2">200 lbs</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Workouts</h2>
            <p className="text-3xl mt-2">{!loaded ? "..." : workoutCount}</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowScheduler((prev) => !prev)}
              className="bg-blue-600 px-5 py-3 rounded-lg"
            >
              📅 Schedule Workout
            </button>
            <button className="bg-green-600 px-5 py-3 rounded-lg">Log Food</button>
            <button className="bg-purple-600 px-5 py-3 rounded-lg">Supplements</button>
          </div>

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


                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 px-4 py-2 rounded">Add to Google Calendar</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}