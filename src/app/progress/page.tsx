"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navigation from "../../components/Navigation";

type WorkoutDay = {
  id: string;
  name: string;
  exercises: { id: string; name: string }[];
};

type HistoryEntry = {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  dayName: string;
  weight: number;
  reps: number;
  sets: number;
};

type WeightEntry = {
  id: string;
  date: string;
  weight: number;
};

function estimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function formatDate(input: string) {
  const isPlainDate = /^\d{4}-\d{2}-\d{2}$/.test(input);
  const date = isPlainDate ? new Date(`${input}T00:00:00`) : new Date(input);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function WeightTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2">
        <p className="text-gray-300 text-sm">{point.date}</p>
        <p className="text-red-400 font-semibold">{point.weight} lbs</p>
      </div>
    );
  }
  return null;
}

export default function ProgressPage() {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);

  const [newWeight, setNewWeight] = useState("");
  const [newWeightDate, setNewWeightDate] = useState(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  });

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [daysRes, historyRes, weightRes] = await Promise.all([
        fetch("/api/workout-days"),
        fetch("/api/history"),
        fetch("/api/weight"),
      ]);

      if (!daysRes.ok || !historyRes.ok || !weightRes.ok) throw new Error();

      setDays(await daysRes.json());
      setHistory(await historyRes.json());
      setWeightLog(await weightRes.json());
    } catch {
      setError("Couldn't load your progress data. Check your connection and try refreshing.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddWeight = async () => {
    const weight = Number(newWeight);
    if (!weight || !newWeightDate) return;

    try {
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newWeightDate, weight }),
      });
      if (!res.ok) throw new Error();
      const savedEntry: WeightEntry = await res.json();

      setWeightLog((prev) => {
        const withoutSameDate = prev.filter((e) => e.date !== savedEntry.date);
        return [...withoutSameDate, savedEntry].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });
      setNewWeight("");
    } catch {
      setError("Couldn't save that weigh-in. Try again.");
    }
  };

  const weightChartData = weightLog.map((entry) => ({
    date: formatDate(entry.date),
    weight: entry.weight,
  }));

  const bestByExercise: Record<string, number> = {};
  history.forEach((entry) => {
    const oneRM = estimated1RM(entry.weight, entry.reps);
    if (!bestByExercise[entry.exerciseId] || oneRM > bestByExercise[entry.exerciseId]) {
      bestByExercise[entry.exerciseId] = oneRM;
    }
  });

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Navigation />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold mb-6">Progress</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Body Weight</h2>

          <div className="flex gap-3 mb-6 flex-wrap items-center">
            <input
              type="date"
              value={newWeightDate}
              onChange={(e) => setNewWeightDate(e.target.value)}
              className="bg-gray-700 p-2 rounded"
            />
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="bg-gray-700 p-2 rounded w-36"
            />
            <button onClick={handleAddWeight} className="bg-red-600 px-4 py-2 rounded">
              Log Weight
            </button>
          </div>

          {weightChartData.length === 0 ? (
            <p className="text-gray-500">
              No weigh-ins logged yet — add one above to start your graph.
            </p>
          ) : (
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip content={<WeightTooltip />} />
                  <Line type="monotone" dataKey="weight" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold">History</h2>

          {days.length === 0 && (
            <p className="text-gray-500">No workout days yet — add some on the Workouts page.</p>
          )}

          {days.map((day) => {
            const dayEntries = history
              .filter((h) => h.dayName === day.name)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={day.id} className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">{day.name}</h3>

                {dayEntries.length === 0 ? (
                  <p className="text-gray-500">No logged sets yet for this day.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-700">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Exercise</th>
                          <th className="py-2 pr-4">Weight</th>
                          <th className="py-2 pr-4">Reps</th>
                          <th className="py-2 pr-4">Sets</th>
                          <th className="py-2 pr-4">PR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayEntries.map((entry) => {
                          const oneRM = estimated1RM(entry.weight, entry.reps);
                          const isPR = oneRM === bestByExercise[entry.exerciseId];

                          return (
                            <tr key={entry.id} className="border-b border-gray-700/50">
                              <td className="py-2 pr-4 text-gray-300">{formatDate(entry.date)}</td>
                              <td className="py-2 pr-4">{entry.exerciseName}</td>
                              <td className="py-2 pr-4">{entry.weight} lbs</td>
                              <td className="py-2 pr-4">{entry.reps}</td>
                              <td className="py-2 pr-4">{entry.sets}</td>
                              <td className="py-2 pr-4">{isPR ? "🏆" : ""}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}