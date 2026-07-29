"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

type Exercise = {
  id: string;
  name: string;
  order: number;
  dayId: string;
  lastWeight: number | null;
  lastReps: number | null;
  lastSets: number | null;
  bestWeight: number | null;
  bestReps: number | null;
  bestSets: number | null;
};

type WorkoutDay = {
  id: string;
  name: string;
  order: number;
  exercises: Exercise[];
};

type Me = {
  role: "ADMIN" | "TRAINER" | "MEMBER";
  members?: { id: string; name: string }[];
};

export default function WorkoutsPage() {
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [me, setMe] = useState<Me | null>(null);
  const [viewingId, setViewingId] = useState("");

  const [newDayName, setNewDayName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");

  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayName, setEditingDayName] = useState("");

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState("");

  const [inputs, setInputs] = useState<Record<string, { weight: string; reps: string; sets: string }>>({});
  const [prFlash, setPrFlash] = useState<Record<string, boolean>>({});

  const workoutDaysUrl = (path = "/api/workout-days") =>
    viewingId ? `${path}?userId=${viewingId}` : path;

  const loadDays = async () => {
    try {
      const res = await fetch(workoutDaysUrl());
      if (!res.ok) throw new Error("Failed to load workout days");
      const data: WorkoutDay[] = await res.json();
      setDays(data);
      setSelectedDayId(data[0]?.id || "");
    } catch (err) {
      setError("Couldn't load your workouts. Check your connection and try refreshing.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    loadDays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingId]);

  const selectedDay = days.find((d) => d.id === selectedDayId);

  const handleAddDay = async () => {
    const name = newDayName.trim();
    if (!name) return;

    try {
      const res = await fetch(workoutDaysUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      const newDay: WorkoutDay = await res.json();

      setDays((prev) => [...prev, newDay]);
      setSelectedDayId(newDay.id);
      setNewDayName("");
    } catch {
      setError("Couldn't add that day. Try again.");
    }
  };

  const handleDeleteDay = async (dayId: string, dayName: string) => {
    const confirmed = window.confirm(`Delete "${dayName}" and all its exercises? This can't be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/workout-days/${dayId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      setDays((prev) => {
        const updated = prev.filter((d) => d.id !== dayId);
        if (selectedDayId === dayId) {
          setSelectedDayId(updated[0]?.id || "");
        }
        return updated;
      });
    } catch {
      setError("Couldn't delete that day. Try again.");
    }
  };

  const moveDay = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= days.length) return;

    const reordered = [...days];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setDays(reordered);

    // Persist new order values for the two swapped days
    try {
      await Promise.all([
        fetch(`/api/workout-days/${reordered[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        }),
        fetch(`/api/workout-days/${reordered[targetIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetIndex }),
        }),
      ]);
    } catch {
      setError("Couldn't save the new order. Try refreshing.");
    }
  };

  const startEditingDay = (day: WorkoutDay) => {
    setEditingDayId(day.id);
    setEditingDayName(day.name);
  };

  const saveEditingDay = async () => {
    const name = editingDayName.trim();
    if (!name || !editingDayId) {
      setEditingDayId(null);
      return;
    }

    const dayId = editingDayId;
    setEditingDayId(null);

    try {
      const res = await fetch(`/api/workout-days/${dayId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();

      setDays((prev) => prev.map((day) => (day.id === dayId ? { ...day, name } : day)));
    } catch {
      setError("Couldn't rename that day. Try again.");
    }
  };

  const handleAddExercise = async () => {
    const name = newExerciseName.trim();
    if (!name || !selectedDay) return;

    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dayId: selectedDay.id }),
      });
      if (!res.ok) throw new Error();
      const newExercise: Exercise = await res.json();

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id ? { ...day, exercises: [...day.exercises, newExercise] } : day
        )
      );
      setNewExerciseName("");
    } catch {
      setError("Couldn't add that exercise. Try again.");
    }
  };

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    const confirmed = window.confirm(`Delete "${exerciseName}"? This can't be undone.`);
    if (!confirmed || !selectedDay) return;

    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id
            ? { ...day, exercises: day.exercises.filter((ex) => ex.id !== exerciseId) }
            : day
        )
      );
    } catch {
      setError("Couldn't delete that exercise. Try again.");
    }
  };

  const moveExercise = async (index: number, direction: -1 | 1) => {
    if (!selectedDay) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedDay.exercises.length) return;

    const reordered = [...selectedDay.exercises];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setDays((prev) =>
      prev.map((day) => (day.id === selectedDay.id ? { ...day, exercises: reordered } : day))
    );

    try {
      await Promise.all([
        fetch(`/api/exercises/${reordered[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        }),
        fetch(`/api/exercises/${reordered[targetIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetIndex }),
        }),
      ]);
    } catch {
      setError("Couldn't save the new order. Try refreshing.");
    }
  };

  const startEditingExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setEditingExerciseName(exercise.name);
  };

  const saveEditingExercise = async () => {
    const name = editingExerciseName.trim();
    if (!name || !editingExerciseId || !selectedDay) {
      setEditingExerciseId(null);
      return;
    }

    const exerciseId = editingExerciseId;
    setEditingExerciseId(null);

    try {
      const res = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id
            ? {
                ...day,
                exercises: day.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, name } : ex)),
              }
            : day
        )
      );
    } catch {
      setError("Couldn't rename that exercise. Try again.");
    }
  };

  const handleInputChange = (exerciseId: string, field: "weight" | "reps" | "sets", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: value },
    }));
  };

  const handleSaveSet = async (exerciseId: string) => {
    const entry = inputs[exerciseId];
    if (!entry?.weight || !entry?.reps || !entry?.sets || !selectedDay) return;

    try {
      const res = await fetch(`/api/exercises/${exerciseId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: Number(entry.weight),
          reps: Number(entry.reps),
          sets: Number(entry.sets),
        }),
      });
      if (!res.ok) throw new Error();

      const { exercise: updatedExercise, isNewPR } = await res.json();

      setDays((prev) =>
        prev.map((day) =>
          day.id === selectedDay.id
            ? {
                ...day,
                exercises: day.exercises.map((ex) => (ex.id === exerciseId ? updatedExercise : ex)),
              }
            : day
        )
      );

      setInputs((prev) => ({ ...prev, [exerciseId]: { weight: "", reps: "", sets: "" } }));

      if (isNewPR) {
        setPrFlash((prev) => ({ ...prev, [exerciseId]: true }));
        setTimeout(() => {
          setPrFlash((prev) => ({ ...prev, [exerciseId]: false }));
        }, 4000);
      }
    } catch {
      setError("Couldn't save that set. Check your connection and try again.");
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

        {me?.role === "TRAINER" && me.members && me.members.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <label className="text-gray-400 text-sm">Viewing:</label>
            <select
              value={viewingId}
              onChange={(e) => setViewingId(e.target.value)}
              className="bg-gray-800 p-2 rounded"
            >
              <option value="">Me</option>
              {me.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {days.length === 0 && (
          <p className="text-gray-500 mb-6">
            No workout days yet — add one below to get started.
          </p>
        )}

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
                    day.id === selectedDayId ? "bg-red-600" : "text-gray-300"
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
          <button onClick={handleAddDay} className="bg-red-700 px-4 py-2 rounded">
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
              <button onClick={handleAddExercise} className="bg-red-800 px-4 py-2 rounded">
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
                      {exercise.lastWeight !== null
                        ? `Last Workout: ${exercise.lastWeight} lbs × ${exercise.lastReps} reps × ${exercise.lastSets} sets`
                        : "No previous data"}
                    </p>

                    {exercise.bestWeight !== null && (
                      <p className="text-amber-400 text-sm mb-3">
                        🏆 Personal Best: {exercise.bestWeight} lbs × {exercise.bestReps} reps × {exercise.bestSets} sets
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
                      <button onClick={() => handleSaveSet(exercise.id)} className="bg-red-600 px-4 py-2 rounded">
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