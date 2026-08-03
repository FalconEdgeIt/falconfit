"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Couldn't sign up. Try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't sign up. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/falconfit-logo.png" alt="FalconFit" className="h-24 mx-auto mb-2" />
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold mb-2">Sign Up</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-gray-700 p-2 rounded w-full"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-red-600 px-4 py-2 rounded w-full font-semibold disabled:opacity-50"
          >
            {submitting ? "Signing up..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-red-400 hover:underline">
              Log In
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
