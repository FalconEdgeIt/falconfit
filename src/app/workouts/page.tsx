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
  personalBest?: LastPerformance;
};

type WorkoutDay = {
  id: string;
  name: string;
  exercises: Exercise[];
};

const STORAGE_KEY = "falconfit-workout-days";
const SESSIONS_KEY = "falconfit-workout-sessions";
const HISTORY_KEY = "falconfit-exercise-history";

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

function estimated1RM(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function recordTodaysSession() {
  const today = new Date().toISOString().slice(0, 10);
  const stored = localStorage.getItem(SESSIONS_KEY);
  const sessions: string[] = stored ? JSON.parse(stored) : [];
  if (!sessions.includes(today)) {
    sessions.push(today);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

type HistoryEntry = {
  date: string;
  exerciseId: string;
  exerciseName: string;
  dayName: string;
  weight: number;
  reps: number;
  sets: number;
};

function recordHistoryEntry(entry: HistoryEntry) {
  const stored = localStorage.getItem(HISTORY_KEY);
  const history: HistoryEntry[] = stored ? JSON.parse(stored) : [];
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export default function WorkoutsPage() {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const [newDayName, setNewDayName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState("");

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState("");

  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string; sets: string }>>({});
  const [prFlash, setPrFlash] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    }
  }, [days, loaded]);

  const selectedDay = days.find((d) => d.id === selectedDayId);
  const selectedDayIndex = days.findIndex((d) => d.id === selectedDayId);

  const handleAddDay = () => {
    const name = newDayName.trim();
    if (!name) return;

    const newDay: WorkoutDay = { id: createId(), name, exercises: [] };
    setDays((prev) => [...prev, newDay]);
    setSelectedDayId(newDay.id);
    setNewDayName("");
  };

  const handleDeleteDay = (dayId: string, dayName: string) => {
    const confirmed = window.confirm(`Delete "${dayName}" and all its exercises? This can't be undone.`);
    if (!confirmed) return;

    setDays((prev) => {
      const updated = prev.filter((d) => d.id !== dayId);
      if (selectedDayId === dayId) {
        setSelectedDayId(updated[0]?.id || "");
      }
      return updated;
    });
  };

  const moveDay = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= days.length) return;
    setDays((prev) => swap(prev, index, targetIndex));
  };

  const startEditingDay = (day: WorkoutDay) => {
    setEditingDayId(day.id);
    setEditingDayName(day.name);
  };

  const saveEditingDay = () => {
    const name = editingDayName.trim();
    if (!name || !editingDayId) {
      setEditingDayId(null);
      return;
    }
    setDays((prev) => prev.map((day) => (day.id === editingDayId ? { ...day, name } : day)));
    setEditingDayId(null);
  };

  const handleAddExercise = () => {
    const name = newExerciseName.trim();
    if (!name || !selectedDay) return;

    const newExercise: Exercise = { id: createId(), name };
    setDays((prev) =>
      prev.map((day) =>
        day.id === selectedDay.id ? { ...day, exercises: [...day.exercises, newExercise] } : day
      )
    );
    setNewExerciseName("");
  };

  const handleDeleteExercise = (exerciseId: string, exerciseName: string) => {
    const confirmed = window.confirm(`Delete "${exerciseName}"? This can't be undone.`);
    if (!confirmed || !selectedDay) return;

    setDays((prev) =>
      prev.map((day) =>
        day.id === selectedDay.id
          ? { ...day, exercises: day.exercises.filter((ex) => ex.id !== exerciseId) }
          : day
      )
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    if (!selectedDay) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedDay.exercises.length) return;

    setDays((prev) =>
      prev.map((day) =>
        day.id === selectedDay.id
          ? { ...day, exercises: swap(day.exercises, index, targetIndex) }
          : day
      )
    );
  };

  const startEditingExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setEditingExerciseName(exercise.name);
  };

  const saveEditingExercise = () => {
    const name = editingExerciseName.trim();
    if (!name || !editingExerciseId || !selectedDay) {
      setEditingExerciseId(null);
      return;
    }
    setDays((prev) =>
      prev.map((day) =>
        day.id === selectedDay.id
          ? {
              ...day,
              exercises: day.exercises.map((ex) =>
                ex.id === editingExerciseId ? { ...ex, name } : ex
              ),
            }
          : day
      )
    );
    setEditingExerciseId(null);
  };

  const handleInputChange = (exerciseId: string, field: "weight" | "reps" | "sets", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: value },
    }));
  };

  const handleSaveSet = (exerciseId: string) => {
    const entry = inputs[exerciseId];
    if (!entry?.weight || !entry?.reps || !entry?.sets || !selectedDay) return;

    const newRecord: LastPerformance = {
      weight: Number(entry.weight),
      reps: Number(entry.reps),
      sets: Number(entry.sets),
    };

    const exercise = selectedDay.exercises.find((ex) => ex.id === exerciseId);
    const newOneRM = estimated1RM(newRecord.weight, newRecord.reps);
    const priorBestOneRM = exercise?.personalBest
      ? estimated1RM(exercise.personalBest.weight, exercise.personalBest.reps)
      : 0;
    const isNewPR = newOneRM > priorBestOneRM;

    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                last: newRecord,
                personalBest: isNewPR ? newRecord : ex.personalBest,
              }
            : ex
        ),
      }))
    );

    recordTodaysSession();

    if (exercise) {
      recordHistoryEntry({
        date: new Date().toISOString(),
        exerciseId,
        exerciseName: exercise.name,
        dayName: selectedDay.name,
        weight: newRecord.weight,
        reps: newRecord.reps,
        sets: newRecord.sets,
      });
    }

    setInputs((prev) => ({ ...prev, [exerciseId]: { weight: "", reps: "", sets: "" } }));

    if (isNewPR) {
      setPrFlash((prev) => ({ ...prev, [exerciseId]: true }));
      setTimeout(() => {
        setPrFlash((prev) => ({ ...prev, [exerciseId]: false }));
      }, 4000);
    }
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

        <div className="flex gap-2 flex-wrap mb-6">
          {days.map((day, index) => (
            <div key={day.id} className="flex items-center bg-gray-800 rounded-lg">
              <div className="flex flex-col">
                <button
                  onClick={() => moveDay(index, -1)}
                  disabled={index === 0}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                  title="Move left"
                >
                  ◀
                </button>
                <button
                  onClick={() => moveDay(index, 1)}
                  disabled={index === days.length - 1}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                  title="Move right"
                >
                  ▶
                </button>
              </div>

              {editingDayId === day.id ? (
                <input
                  type="text"
                  value={editingDayName}
                  onChange={(e) => setEditingDayName(e.target.value)}
                  onBlur={saveEditingDay}
                  onKeyDown={(e) => e.key === "Enter" && saveEditingDay()}
                  autoFocus
                  className="bg-gray-700 p-2 rounded w-32"
                />
              ) : (
                <button
                  onClick={() => setSelectedDayId(day.id)}
                  className={`px-4 py-2 rounded-lg ${
                    day.id === selectedDayId ? "bg-blue-600" : "text-gray-300"
                  }`}
                >
                  {day.name}
                </button>
              )}
              <button onClick={() => startEditingDay(day)} className="text-gray-400 hover:text-white px-1" title="Rename day">
                ✎
              </button>
              <button onClick={() => handleDeleteDay(day.id, day.name)} className="text-gray-400 hover:text-red-400 px-1" title="Delete day">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="New day name (e.g. Cardio)"
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            className="bg-gray-800 p-2 rounded flex-1"
          />
          <button onClick={handleAddDay} className="bg-green-600 px-4 py-2 rounded">
            Add Day
          </button>
        </div>

        {selectedDay && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedDay.name}</h2>

            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="New exercise name (e.g. Bench Press)"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="bg-gray-700 p-2 rounded flex-1"
              />
              <button onClick={handleAddExercise} className="bg-purple-600 px-4 py-2 rounded">
                Add Exercise
              </button>
            </div>

            {selectedDay.exercises.length === 0 && (
              <p className="text-gray-500">No exercises yet — add one above to get started.</p>
            )}

            <div className="space-y-6">
              {selectedDay.exercises.map((exercise, index) => (
                <div key={exercise.id} className="flex gap-3">
                  <div className="flex flex-col justify-center gap-1 pt-1">
                    <button
                      onClick={() => moveExercise(index, -1)}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveExercise(index, 1)}
                      disabled={index === selectedDay.exercises.length - 1}
                      className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {editingExerciseId === exercise.id ? (
                        <input
                          type="text"
                          value={editingExerciseName}
                          onChange={(e) => setEditingExerciseName(e.target.value)}
                          onBlur={saveEditingExercise}
                          onKeyDown={(e) => e.key === "Enter" && saveEditingExercise()}
                          autoFocus
                          className="bg-gray-700 p-2 rounded"
                        />
                      ) : (
                        <h3 className="text-xl font-semibold">{exercise.name}</h3>
                      )}
                      <button onClick={() => startEditingExercise(exercise)} className="text-gray-400 hover:text-white px-1" title="Rename exercise">
                        ✎
                      </button>
                      <button onClick={() => handleDeleteExercise(exercise.id, exercise.name)} className="text-gray-400 hover:text-red-400 px-1" title="Delete exercise">
                        ✕
                      </button>
                    </div>

                    <p className="text-gray-400 mb-1">
                      {exercise.last
                        ? `Last Workout: ${exercise.last.weight} lbs × ${exercise.last.reps} reps × ${exercise.last.sets} sets`
                        : "No previous data"}
                    </p>

                    {exercise.personalBest && (
                      <p className="text-amber-400 text-sm mb-3">
                        🏆 Personal Best: {exercise.personalBest.weight} lbs × {exercise.personalBest.reps} reps × {exercise.personalBest.sets} sets
                      </p>
                    )}

                    {prFlash[exercise.id] && (
                      <p className="text-green-400 font-semibold mb-3">🎉 New PR!</p>
                    )}

                    <div className="flex gap-4 items-center flex-wrap">
                      <input
                        type="number"
                        placeholder="Weight"
                        value={inputs[exercise.id]?.weight || ""}
                        onChange={(e) => handleInputChange(exercise.id, "weight", e.target.value)}
                        className="bg-gray-700 p-2 rounded w-28"
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={inputs[exercise.id]?.reps || ""}
                        onChange={(e) => handleInputChange(exercise.id, "reps", e.target.value)}
                        className="bg-gray-700 p-2 rounded w-28"
                      />
                      <input
                        type="number"
                        placeholder="Sets"
                        value={inputs[exercise.id]?.sets || ""}
                        onChange={(e) => handleInputChange(exercise.id, "sets", e.target.value)}
                        className="bg-gray-700 p-2 rounded w-28"
                      />
                      <button onClick={() => handleSaveSet(exercise.id)} className="bg-blue-600 px-4 py-2 rounded">
                        Save Set
                      </button>
                    </div>
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