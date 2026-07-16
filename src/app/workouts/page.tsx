"use client";

import { useState } from "react";
import Navigation from "../../components/Navigation";

type Exercise = {
  name: string;
  lastWeight: number;
  lastReps: number;
};

const pushDayExercises: Exercise[] = [
  { name: "Bench Press", lastWeight: 95, lastReps: 12 },
  { name: "Shoulder Press", lastWeight: 35, lastReps: 12 },
  { name: "Incline Bench", lastWeight: 65, lastReps: 10 },
  { name: "Lateral Raise", lastWeight: 15, lastReps: 15 },
  { name: "Tricep Pushdown", lastWeight: 40, lastReps: 12 },
];

export default function WorkoutsPage() {
  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string }>>({});
  const [savedSets, setSavedSets] = useState<Record<string, string>>({});

  const handleChange = (exercise: string, field: "weight" | "reps", value: string) => {
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
    if (!entry?.weight || !entry?.reps) return;

    setSavedSets((prev) => ({
      ...prev,
      [exercise]: `${entry.weight} lbs × ${entry.reps} reps`,
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
            {pushDayExercises.map((exercise) => (
              <div key={exercise.name}>
                <h3 className="text-xl font-semibold">{exercise.name}</h3>
                <p className="text-gray-400 mb-3">
                  Last Workout: {exercise.lastWeight} lbs × {exercise.lastReps} reps
                </p>

                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    placeholder="Weight"
                    value={inputs[exercise.name]?.weight || ""}
                    onChange={(e) => handleChange(exercise.name, "weight", e.target.value)}
                    className="bg-gray-700 p-2 rounded w-32"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={inputs[exercise.name]?.reps || ""}
                    onChange={(e) => handleChange(exercise.name, "reps", e.target.value)}
                    className="bg-gray-700 p-2 rounded w-32"
                  />
                  <button
                    onClick={() => handleSave(exercise.name)}
                    className="bg-blue-600 px-4 py-2 rounded"
                  >
                    Save Set
                  </button>
                  {savedSets[exercise.name] && (
                    <span className="text-green-400 text-sm">
                      ✔ Saved: {savedSets[exercise.name]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}