"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";

type Role = "ADMIN" | "TRAINER" | "MEMBER";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  disabled: boolean;
  passwordResetRequestedAt: string | null;
  groupId: string | null;
  group: { id: string; name: string } | null;
  ledGroup: { id: string; name: string } | null;
};

type AdminGroup = {
  id: string;
  name: string;
  trainer: { id: string; name: string };
  members: { id: string; name: string }[];
};

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("MEMBER");
  const [newGroupId, setNewGroupId] = useState("");

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTrainerId, setNewGroupTrainerId] = useState("");

  const [resetPasswordForId, setResetPasswordForId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => {
        if (me?.role !== "ADMIN") {
          router.push("/");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => router.push("/"));
  }, [router]);

  const loadData = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/groups"),
      ]);
      if (!usersRes.ok || !groupsRes.ok) throw new Error();
      setUsers(await usersRes.json());
      setGroups(await groupsRes.json());
    } catch {
      setError("Couldn't load users and groups.");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (authChecked) loadData();
  }, [authChecked]);

  const trainers = users.filter((u) => u.role === "TRAINER");

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          groupId: newRole === "MEMBER" ? newGroupId || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("MEMBER");
      setNewGroupId("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that user.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all their data? This can't be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that user.");
    }
  };

  const handleToggleDisabled = async (id: string, disabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that user.");
    }
  };

  const handleChangeRole = async (id: string, role: Role) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...(role !== "MEMBER" && { groupId: null }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that user.");
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!resetPasswordValue) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setResetPasswordForId(null);
      setResetPasswordValue("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset that password.");
    }
  };

  const handleAssignGroup = async (id: string, groupId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that user.");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupTrainerId) return;

    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), trainerId: newGroupTrainerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group");

      setNewGroupName("");
      setNewGroupTrainerId("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that group.");
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!window.confirm(`Delete group "${name}"? Members will become unassigned.`)) return;

    try {
      const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete group");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that group.");
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
        <h1 className="text-4xl font-bold mb-6">Admin</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-3 mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-300 hover:text-white px-2">
              ✕
            </button>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Users</h2>

          <div className="space-y-2 mb-6">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                  {u.passwordResetRequestedAt && (
                    <p className="text-yellow-400 text-xs mt-1">
                      🔔 Requested a password reset{" "}
                      {new Date(u.passwordResetRequestedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <select
                  value={u.role}
                  onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                  className="bg-gray-600 p-1.5 rounded text-xs uppercase tracking-wide"
                >
                  <option value="MEMBER">Member</option>
                  <option value="TRAINER">Trainer</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {u.role === "MEMBER" && (
                  <select
                    value={u.groupId || ""}
                    onChange={(e) => handleAssignGroup(u.id, e.target.value)}
                    className="bg-gray-800 p-1.5 rounded text-sm"
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
                {u.role === "TRAINER" && u.ledGroup && (
                  <span className="text-gray-400 text-sm">leads {u.ledGroup.name}</span>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={u.disabled}
                    onChange={(e) => handleToggleDisabled(u.id, e.target.checked)}
                  />
                  Blocked
                </label>
                <button
                  onClick={() => {
                    setResetPasswordForId(resetPasswordForId === u.id ? null : u.id);
                    setResetPasswordValue("");
                  }}
                  className="text-gray-400 hover:text-red-400 text-sm"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id, u.name)}
                  className="text-gray-400 hover:text-red-400 px-2"
                  title="Delete user"
                >
                  ✕
                </button>
              </div>
              {resetPasswordForId === u.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-600">
                  <input
                    type="password"
                    placeholder="New password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    autoFocus
                    className="bg-gray-800 p-1.5 rounded text-sm flex-1 min-w-[140px]"
                  />
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="bg-red-600 px-3 py-1.5 rounded text-sm"
                  >
                    Save
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold mb-3">Create User</h3>
            <div className="flex gap-3 flex-wrap mb-2">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-gray-700 p-2 rounded flex-1 min-w-[140px]"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-gray-700 p-2 rounded flex-1 min-w-[160px]"
              />
              <input
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-700 p-2 rounded flex-1 min-w-[140px]"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="bg-gray-700 p-2 rounded"
              >
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </select>
              {newRole === "MEMBER" && (
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="bg-gray-700 p-2 rounded"
                >
                  <option value="">No group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
              <button onClick={handleCreateUser} className="bg-red-600 px-4 py-2 rounded">
                Create
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Groups</h2>

          <div className="space-y-2 mb-6">
            {groups.length === 0 && <p className="text-gray-500">No groups yet.</p>}
            {groups.map((g) => (
              <div key={g.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-gray-400 text-sm">
                      Trainer: {g.trainer.name} · {g.members.length} member
                      {g.members.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(g.id, g.name)}
                    className="text-gray-400 hover:text-red-400 px-2"
                    title="Delete group"
                  >
                    ✕
                  </button>
                </div>
                {g.members.length > 0 && (
                  <p className="text-gray-500 text-sm mt-2">
                    {g.members.map((m) => m.name).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-semibold mb-3">Create Group</h3>
            {trainers.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Create a Trainer above first — a Group needs one to lead it.
              </p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="bg-gray-700 p-2 rounded flex-1 min-w-[160px]"
                />
                <select
                  value={newGroupTrainerId}
                  onChange={(e) => setNewGroupTrainerId(e.target.value)}
                  className="bg-gray-700 p-2 rounded"
                >
                  <option value="">Select trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button onClick={handleCreateGroup} className="bg-red-600 px-4 py-2 rounded">
                  Create
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
