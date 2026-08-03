"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  name: string;
  role: "ADMIN" | "TRAINER" | "MEMBER";
};

export default function Navigation() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-gray-800 p-4 rounded-xl mb-6 flex items-center justify-between flex-wrap gap-4">
      <a href="/" className="flex items-center gap-2">
        <img src="/falconfit-icon.png" alt="FalconFit" className="h-9 w-auto" />
        <span className="font-bold text-lg tracking-tight">FALCONFIT</span>
      </a>
      <ul className="flex flex-wrap gap-4 items-center">
        <li>
          <a href="/" className="hover:text-red-400">
            🏠 Dashboard
          </a>
        </li>
        <li>
          <a href="/workouts" className="hover:text-red-400">
            🏋 Workouts
          </a>
        </li>
        <li>
          <a href="/nutrition" className="hover:text-red-400">
            🍗 Nutrition
          </a>
        </li>
        <li>
          <a href="/progress" className="hover:text-red-400">
            ⚖ Progress
          </a>
        </li>
        <li>
          <a href="/settings" className="hover:text-red-400">
            ⚙ Settings
          </a>
        </li>
        {me?.role === "ADMIN" && (
          <li>
            <a href="/admin" className="hover:text-red-400">
              🛠 Admin
            </a>
          </li>
        )}
        {me && (
          <>
            <li className="text-gray-400 text-sm">{me.name}</li>
            <li>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-400" title="Log out">
                Log Out
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
