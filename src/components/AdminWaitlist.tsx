"use client";

import { useEffect, useState } from "react";

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  business: string | null;
  clientCount: string | null;
  createdAt: string;
};

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/waitlist")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setEntries)
      .catch(() => setError("Couldn't load the waitlist."));
  }, []);

  return (
    <div className="bg-gray-800 rounded-xl p-6 mt-8">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-2xl font-bold">Coach Waitlist</h2>
        {entries && <p className="text-gray-400 text-sm">{entries.length} signed up</p>}
      </div>

      {error && <p className="text-red-300 text-sm">{error}</p>}
      {!entries && !error && <p className="text-gray-400">Loading...</p>}
      {entries?.length === 0 && (
        <p className="text-gray-500">
          No sign-ups yet. They come from the{" "}
          <a href="/coaches" className="text-red-400">
            coaches page
          </a>
          .
        </p>
      )}

      {entries && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="bg-gray-700 rounded-lg p-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <p className="font-semibold">
                  {e.name}
                  {e.business && <span className="text-gray-400 font-normal"> · {e.business}</span>}
                </p>
                <a href={`mailto:${e.email}`} className="text-gray-400 text-sm hover:text-red-400 break-all">
                  {e.email}
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                {e.clientCount ? `${e.clientCount} clients · ` : ""}
                {new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
