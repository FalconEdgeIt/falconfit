"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

type Profile = {
  id: string;
  goalWeight: number | null;
  birthdate: string | null;
  heightInches: number | null;
  sex: string | null;
};

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function SettingsPage() {
  const [goalWeight, setGoalWeight] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInchesRemainder, setHeightInchesRemainder] = useState("");
  const [sex, setSex] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error();
        const profile: Profile = await res.json();

        setGoalWeight(profile.goalWeight?.toString() || "");
        setBirthdate(profile.birthdate ? profile.birthdate.slice(0, 10) : "");
        setSex(profile.sex || "");

        if (profile.heightInches) {
          setHeightFeet(Math.floor(profile.heightInches / 12).toString());
          setHeightInchesRemainder((profile.heightInches % 12).toString());
        }
      } catch {
        setError("Couldn't load your profile.");
      } finally {
        setLoaded(true);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setError("");
    setSaved(false);

    const feet = Number(heightFeet) || 0;
    const inches = Number(heightInchesRemainder) || 0;
    const totalHeightInches = feet * 12 + inches;

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalWeight: goalWeight ? Number(goalWeight) : null,
          birthdate: birthdate || null,
          heightInches: totalHeightInches || null,
          sex: sex || null,
        }),
      });
      if (!res.ok) throw new Error();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Couldn't save your profile. Try again.");
    }
  };

  const age = birthdate ? calculateAge(birthdate) : null;

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
        <h1 className="text-4xl font-bold mb-6">Settings</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-gray-400 mb-2">Goal Weight (lbs)</label>
            <input
              type="number"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="bg-gray-700 p-2 rounded w-40"
              placeholder="e.g. 200"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Birthdate</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="bg-gray-700 p-2 rounded"
            />
            {age !== null && (
              <p className="text-gray-500 text-sm mt-1">Age: {age}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Height</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                className="bg-gray-700 p-2 rounded w-20"
                placeholder="ft"
              />
              <span className="text-gray-400">ft</span>
              <input
                type="number"
                value={heightInchesRemainder}
                onChange={(e) => setHeightInchesRemainder(e.target.value)}
                className="bg-gray-700 p-2 rounded w-20"
                placeholder="in"
              />
              <span className="text-gray-400">in</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="bg-gray-700 p-2 rounded"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className="bg-blue-600 px-5 py-2 rounded"
          >
            Save Settings
          </button>

          {saved && (
            <p className="text-green-400 text-sm">✔ Saved</p>
          )}
        </div>
      </div>
    </main>
  );
}