"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";

const SESSIONS_KEY = "falconfit-workout-sessions";

export default function Home() {
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    const sessions: string[] = stored ? JSON.parse(stored) : [];
    setWorkoutCount(sessions.length);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Navigation />
        <h1 className="text-4xl font-bold mb-6">FalconFit</h1>
        <p className="text-gray-300 mb-8">Your personal fitness tracking dashboard</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Current Weight</h2>
            <p className="text-3xl mt-2">249 lbs</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Goal Weight</h2>
            <p className="text-3xl mt-2">200 lbs</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-semibold">Workouts</h2>
            <p className="text-3xl mt-2">{workoutCount}</p>
          </div>
        </div>
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button className="bg-blue-600 px-5 py-3 rounded-lg">Start Workout</button>
            <button className="bg-green-600 px-5 py-3 rounded-lg">Log Food</button>
            <button className="bg-purple-600 px-5 py-3 rounded-lg">Supplements</button>
          </div>
        </div>
      </div>
    </main>
  );
}