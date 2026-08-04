"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../../../components/Navigation";

type Member = { id: string; name: string; email: string };

type Group = {
  id: string;
  name: string;
  members: Member[];
};

type WorkoutDay = {
  id: string;
  name: string;
};

export default function TrainerGroupPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [addMemberId, setAddMemberId] = useState("");

  const [sendPanelDayId, setSendPanelDayId] = useState<string | null>(null);
  const [sendMemberIds, setSendMemberIds] = useState<string[]>([]);
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.role !== "TRAINER") {
          router.push("/");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => router.push("/"));
  }, [router]);

  const loadData = async () => {
    try {
      const [groupRes, daysRes] = await Promise.all([
        fetch("/api/trainer/group"),
        fetch("/api/workout-days"),
      ]);
      if (!groupRes.ok || !daysRes.ok) throw new Error();
      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setAvailableMembers(groupData.availableMembers);
      setDays(await daysRes.json());
    } catch {
      setError("Couldn't load your Group. Check your connection and try refreshing.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (authChecked) loadData();
  }, [authChecked]);

  const handleAddMember = async () => {
    if (!addMemberId) return;

    try {
      const res = await fetch("/api/trainer/group/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: addMemberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      setAddMemberId("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that Member.");
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from your Group?`)) return;

    try {
      const res = await fetch(`/api/trainer/group/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that Member.");
    }
  };

  const toggleSendPanel = (dayId: string) => {
    setSendPanelDayId((prev) => (prev === dayId ? null : dayId));
    setSendMemberIds([]);
    setSendMessage("");
  };

  const toggleSendMember = (memberId: string) => {
    setSendMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSendDay = async (dayId: string) => {
    if (sendMemberIds.length === 0) return;

    try {
      const res = await fetch(`/api/workout-days/${dayId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: sendMemberIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      setSendMessage(`Sent to ${data.sentTo} member${data.sentTo === 1 ? "" : "s"}.`);
      setSendMemberIds([]);
    } catch (err) {
      setSendMessage(err instanceof Error ? err.message : "Couldn't send that workout.");
    }
  };

  if (!authChecked || !loaded) {
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
        <h1 className="text-4xl font-bold mb-6">My Group</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-300 hover:text-white px-2">
              ✕
            </button>
          </div>
        )}

        {!group ? (
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400">
              You don&apos;t lead a Group yet — ask an Admin to create one for you.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">{group.name}</h2>

              {group.members.length === 0 && (
                <p className="text-gray-500 mb-4">No members yet — add one below.</p>
              )}

              <div className="space-y-2 mb-6">
                {group.members.map((m) => (
                  <div
                    key={m.id}
                    className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-gray-400 text-sm">{m.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      className="text-gray-400 hover:text-red-400 px-2"
                      title="Remove from Group"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-3">Add Member</h3>
                {availableMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No unassigned Members available.</p>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={addMemberId}
                      onChange={(e) => setAddMemberId(e.target.value)}
                      className="bg-gray-700 p-2 rounded flex-1 min-w-[160px]"
                    >
                      <option value="">Select a Member</option>
                      {availableMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!addMemberId}
                      className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Send a Workout</h2>

              {days.length === 0 && (
                <p className="text-gray-500">
                  You don&apos;t have any workout days yet — add some on the{" "}
                  <a href="/workouts" className="text-red-400 hover:underline">
                    Workouts
                  </a>{" "}
                  page first.
                </p>
              )}

              {group.members.length === 0 && days.length > 0 && (
                <p className="text-gray-500">Add a Member to your Group before sending a workout.</p>
              )}

              <div className="space-y-2">
                {days.map((day) => (
                  <div key={day.id}>
                    <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <p className="font-semibold">{day.name}</p>
                      {group.members.length > 0 && (
                        <button
                          onClick={() => toggleSendPanel(day.id)}
                          className="text-gray-400 hover:text-red-400 px-2"
                          title="Send to Members"
                        >
                          ➤ Send
                        </button>
                      )}
                    </div>

                    {sendPanelDayId === day.id && (
                      <div className="bg-gray-900 rounded-lg p-4 mt-2">
                        {sendMessage && <p className="text-green-400 text-sm mb-3">{sendMessage}</p>}

                        <div className="flex flex-col gap-2 mb-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sendMemberIds.length === group.members.length}
                              onChange={(e) =>
                                setSendMemberIds(e.target.checked ? group.members.map((m) => m.id) : [])
                              }
                            />
                            Whole Group
                          </label>
                          {group.members.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 pl-4 text-gray-300">
                              <input
                                type="checkbox"
                                checked={sendMemberIds.includes(m.id)}
                                onChange={() => toggleSendMember(m.id)}
                              />
                              {m.name}
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSendDay(day.id)}
                            disabled={sendMemberIds.length === 0}
                            className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => setSendPanelDayId(null)}
                            className="text-gray-400 hover:text-white px-2"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
