"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

type LastPerformance = {
  weight: number;
  reps: number;
  sets: number;
};

type Exercise = {
  id: string;
  name: string;
  last?: LastPerformance;
};

type WorkoutDay = {
  id: string;
  name: string;
  exercises: Exercise[];
};

const STORAGE_KEY = "falconfit-workout-days";

const DEFAULT_DAY_NAMES = ["Chest", "Arms", "Back", "Legs", "Mobility", "Sport"];

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function getDefaultDays(): WorkoutDay[] {
  return DEFAULT_DAY_NAMES.map((name) => ({
    id: createId(),
    name,
    exercises: [],
  }));
}

export default function WorkoutsPage() {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const [newDayName, setNewDayName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");

  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string; sets: string }>>({});

  // Load from localStorage on first render, or seed defaults if nothing saved yet
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedDays: WorkoutDay[] = JSON.parse(stored);
      setDays(parsedDays);
      setSelectedDayId(parsedDays[0]?.id || "");
    } else {
      const defaults = getDefaultDays();
      setDays(defaults);
      setSelectedDayId(defaults[0].id);
    }
    setLoaded(true);
  }, []);

  // Save to localStorage any time days change (but not on the very first empty render)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  }, [days, loaded]);

  const selectedDay = days.find((d) => d.id === selectedDayId);

  const handleAddDay = () => {
    const name = newDayName.trim();
    if (!name) return;

    const newDay: WorkoutDay = {
      id: createId(),
      name,
      exercises: [],
    };

    setDays((prev) => [...prev, newDay]);
    setSelectedDayId(newDay.id);
    setNewDayName("");
  };

  const handleAddExercise = () => {
    const name = newExerciseName.trim();
    if (!name || !selectedDay) return;

    const newExercise: Exercise = {
      id: createId(),
      name,
    };

    setDays((prev) =>
      prev.map((day) =>
        day.id === selectedDay.id
          ? { ...day, exercises: [...day.exercises, newExercise] }
          : day
      )
    );
    setNewExerciseName("");
  };

  const handleInputChange = (
    exerciseId: string,
    field: "weight" | "reps" | "sets",
    value: string
  ) => {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }));
  };

  const handleSaveSet = (exerciseId: string) => {
    const entry = inputs[exerciseId];
    if (!entry?.weight || !entry?.reps || !entry?.sets) return;

    const newLast: LastPerformance = {
      weight: Number(entry.weight),
      reps: Number(entry.reps),
      sets: Number(entry.sets),
    };

    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, last: newLast } : ex
        ),
      }))
    );

    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { weight: "", reps: "", sets: "" },
    }));
  };

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
        <h1 className="text-4xl font-bold mb-6">Workout Tracker</h1>

        {/* Day selector tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={`px-4 py-2 rounded-lg ${
                day.id === selectedDayId
                  ? "bg-blue-600"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>

        {/* Add new day */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="New day name (e.g. Cardio)"
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            className="bg-gray-800 p-2 rounded flex-1"
          />
          <button
            onClick={handleAddDay}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Add Day
          </button>
        </div>

        {selectedDay && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedDay.name}</h2>

            {/* Add new exercise to this day */}
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="New exercise name (e.g. Bench Press)"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="bg-gray-700 p-2 rounded flex-1"
              />
              <button
                onClick={handleAddExercise}
                className="bg-purple-600 px-4 py-2 rounded"
              >
                Add Exercise
              </button>
            </div>

            {selectedDay.exercises.length === 0 && (
              <p className="text-gray-500">
                No exercises yet — add one above to get started.
              </p>
            )}

            <div className="space-y-6">
              {selectedDay.exercises.map((exercise) => (
                <div key={exercise.id}>
                  <h3 className="text-xl font-semibold">{exercise.name}</h3>
                  <p className="text-gray-400 mb-3">
                    {exercise.last
                      ? `Last Workout: ${exercise.last.weight} lbs × ${exercise.last.reps} reps × ${exercise.last.sets} sets`
                      : "No previous data"}
                  </p>

                  <div className="flex gap-4 items-center flex-wrap">
                    <input
                      type="number"
                      placeholder="Weight"
                      value={inputs[exercise.id]?.weight || ""}
                      onChange={(e) =>
                        handleInputChange(exercise.id, "weight", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={inputs[exercise.id]?.reps || ""}
                      onChange={(e) =>
                        handleInputChange(exercise.id, "reps", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={inputs[exercise.id]?.sets || ""}
                      onChange={(e) =>
                        handleInputChange(exercise.id, "sets", e.target.value)
                      }
                      className="bg-gray-700 p-2 rounded w-28"
                    />
                    <button
                      onClick={() => handleSaveSet(exercise.id)}
                      className="bg-blue-600 px-4 py-2 rounded"
                    >
                      Save Set
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}