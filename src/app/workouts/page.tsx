"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

type Exercise = {
  name: string;
  lastWeight: number;
  lastReps: number;
  lastSets: number;
};

const pushDayExercises: Exercise[] = [
  { name: "Bench Press", lastWeight: 95, lastReps: 12, lastSets: 3 },
  { name: "Shoulder Press", lastWeight: 35, lastReps: 12, lastSets: 3 },
  { name: "Incline Bench", lastWeight: 65, lastReps: 10, lastSets: 3 },
  { name: "Lateral Raise", lastWeight: 15, lastReps: 15, lastSets: 3 },
  { name: "Tricep Pushdown", lastWeight: 40, lastReps: 12, lastSets: 3 },
];

const STORAGE_KEY = "falconfit-last-performance";

type PerformanceRecord = {
  weight: number;
  reps: number;
  sets: number;
};

export default function WorkoutsPage() {
 const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string; sets: string }>>({});

  const [lastPerformance, setLastPerformance] = useState<Record<string, PerformanceRecord>>({});

  // On load: seed defaults from pushDayExercises, then overlay anything saved in localStorage
  useEffect(() => {
    const defaults: Record<string, PerformanceRecord> = {};
    pushDayExercises.forEach((ex) => {
      defaults[ex.name] = {
        weight: ex.lastWeight,
        reps: ex.lastReps,
        sets: ex.lastSets,
      };
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};

    setLastPerformance({ ...defaults, ...parsed });
  }, []);

  const handleChange = (
    exercise: string,
    field: "weight" | "reps" | "sets",
    value: string
  ) => {
    setInputs((prev) => ({
      ...prev,
      [exercise]: {
        ...prev[exercise],
        [field]: value,
      },
    }));
  };

  const handleSave = (exercise: string) => {
    const entry = inputs[exercise];
    if (!entry?.weight || !entry?.reps || !entry?.sets) return;

    const newRecord: PerformanceRecord = {
      weight: Number(entry.weight),
      reps: Number(entry.reps),
      sets: Number(entry.sets),
    };

    const updated = {
      ...lastPerformance,
      [exercise]: newRecord,
    };

    setLastPerformance(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Clear the inputs after saving
    setInputs((prev) => ({
      ...prev,
      [exercise]: { weight: "", reps: "", sets: "" },
    }));
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold mb-6">Workout Tracker</h1>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Push Day</h2>

          <div className="space-y-6">
            {pushDayExercises.map((exercise) => {
              const last = lastPerformance[exercise.name];

              return (
                <div key={exercise.name}>
                  <h3 className="text-xl font-semibold">{exercise.name}</h3>
                  <p className="text-gray-400 mb-3">
                    {last
                      ? `Last Workout: ${last.weight} lbs × ${last.reps} reps × ${last.sets} sets`
                      : "No previous data"}
                  </p>

                  <div className="flex gap-4 items-center flex-wrap">
                    <input
                      type="number"
                      placeholder="Weight"
                      value={inputs[exercise.name]?.weight || ""}
                      onChange={(e) =>
                        handleChange(exercise.name, "weight", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={inputs[exercise.name]?.reps || ""}
                      onChange={(e) =>
                        handleChange(exercise.name, "reps", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={inputs[exercise.name]?.sets || ""}
                      onChange={(e) =>
                        handleChange(exercise.name, "sets", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <button
                      onClick={() => handleSave(exercise.name)}
                      className="bg-blue-600 px-4 py-2 rounded"
                    >
                      Save Set
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}