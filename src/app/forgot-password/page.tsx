"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
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

        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>

          {submitted ? (
            <div className="bg-green-900/50 border border-green-700 text-green-200 rounded-lg p-3 text-sm">
              If an account with that email exists, an admin has been notified and will reset your
              password for you.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your email and an admin will reset your password for you.
              </p>

              <div>
                <label className="block text-gray-400 mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-gray-700 p-2 rounded w-full"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 px-4 py-2 rounded w-full font-semibold disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-400">
            <a href="/login" className="text-red-400 hover:underline">
              Back to Log In
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
