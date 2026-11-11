"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CLIENT_COUNTS } from "../lib/waitlist";

const field = "w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-base focus:border-red-600";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [clientCount, setClientCount] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, business, clientCount, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't save your spot. Try again.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-2xl p-6" role="status">
        <CheckCircle2 size={28} className="text-red-400 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-display font-bold text-2xl uppercase">You&apos;re on the list</p>
          <p className="text-gray-300 mt-1">
            We&apos;ll be in touch before launch to set up your account and walk you through it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm text-gray-300 mb-1.5">Your name</span>
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" />
        </label>
        <label className="block">
          <span className="block text-sm text-gray-300 mb-1.5">Email</span>
          <input
            required
            type="email"
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="block text-sm text-gray-300 mb-1.5">
            Gym or business <span className="text-gray-500">(optional)</span>
          </span>
          <input maxLength={120} value={business} onChange={(e) => setBusiness(e.target.value)} className={field} autoComplete="organization" />
        </label>
        <label className="block">
          <span className="block text-sm text-gray-300 mb-1.5">
            How many clients do you train? <span className="text-gray-500">(optional)</span>
          </span>
          <select value={clientCount} onChange={(e) => setClientCount(e.target.value)} className={field}>
            <option value="">Choose one</option>
            {CLIENT_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Hidden from people; bots that fill it in are quietly ignored */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
      />

      {error && <p className="text-red-300 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 px-7 py-3.5 rounded-lg font-semibold"
      >
        {status === "sending" ? "Saving your spot..." : "Join the waitlist"}
        <ArrowRight size={18} />
      </button>
      <p className="text-gray-500 text-xs">We&apos;ll only use your email to contact you about FalconFit.</p>
    </form>
  );
}
