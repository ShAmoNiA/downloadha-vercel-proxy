"use client";

import { FormEvent, useEffect, useState } from "react";

type CreatedUser = {
  username: string;
  scope: "all" | "prefixes";
  prefixes: string[];
  expiresAt: string | null;
  token: string;
  portalUrl: string;
  proxyBaseUrl: string;
};

const storageKey = "proxy-admin-created-users";

export default function AdminPage() {
  const [adminUsername, setAdminUsername] = useState("shayan");
  const [adminPassword, setAdminPassword] = useState("");
  const [username, setUsername] = useState("");
  const [scope, setScope] = useState<"all" | "prefixes">("prefixes");
  const [prefixes, setPrefixes] = useState("https://www.wikipedia.org/");
  const [expiresDays, setExpiresDays] = useState("30");
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (raw) {
      setCreatedUsers(JSON.parse(raw) as CreatedUser[]);
    }
  }, []);

  function saveUsers(users: CreatedUser[]) {
    setCreatedUsers(users);
    window.localStorage.setItem(storageKey, JSON.stringify(users));
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const auth = window.btoa(`${adminUsername}:${adminPassword}`);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          scope,
          prefixes,
          expiresDays,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      const nextUsers = [data as CreatedUser, ...createdUsers].slice(0, 30);
      saveUsers(nextUsers);
      setUsername("");
      setStatus("User link created.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function clearSavedUsers() {
    saveUsers([]);
  }

  return (
    <main className="admin-shell">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Proxy Access Dashboard</h1>
        </div>
        <a href="/">Home</a>
      </section>

      <section className="admin-grid">
        <form className="panel admin-form" onSubmit={createUser}>
          <h2>Create User Access</h2>

          <label>
            Admin username
            <input
              autoComplete="username"
              value={adminUsername}
              onChange={(event) => setAdminUsername(event.target.value)}
            />
          </label>

          <label>
            Admin password
            <input
              autoComplete="current-password"
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
            />
          </label>

          <label>
            New user name
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="alex"
            />
          </label>

          <fieldset>
            <legend>Access</legend>
            <label className="inline-choice">
              <input
                checked={scope === "all"}
                name="scope"
                type="radio"
                onChange={() => setScope("all")}
              />
              All pages
            </label>
            <label className="inline-choice">
              <input
                checked={scope === "prefixes"}
                name="scope"
                type="radio"
                onChange={() => setScope("prefixes")}
              />
              Specific pages
            </label>
          </fieldset>

          <label>
            Allowed URL prefixes
            <textarea
              disabled={scope === "all"}
              value={prefixes}
              onChange={(event) => setPrefixes(event.target.value)}
              placeholder={"https://www.wikipedia.org/\nhttps://www.google.com/search"}
              rows={5}
            />
          </label>

          <label>
            Expires after days
            <input
              inputMode="numeric"
              value={expiresDays}
              onChange={(event) => setExpiresDays(event.target.value)}
            />
          </label>

          <button disabled={busy} type="submit">
            {busy ? "Creating..." : "Create Access Link"}
          </button>
          {status ? <p className="status-line">{status}</p> : null}
        </form>

        <section className="panel user-list">
          <div className="list-heading">
            <h2>Created Users</h2>
            <button className="secondary-button" onClick={clearSavedUsers}>
              Clear
            </button>
          </div>

          {createdUsers.length === 0 ? (
            <p className="muted">Created links will appear here in this browser.</p>
          ) : (
            <div className="user-stack">
              {createdUsers.map((user) => (
                <article className="user-row" key={user.token}>
                  <div>
                    <h3>{user.username}</h3>
                    <p>
                      {user.scope === "all" ? "All pages" : "Specific pages"}
                      {user.expiresAt ? ` · expires ${user.expiresAt}` : ""}
                    </p>
                  </div>
                  <div className="link-row">
                    <a href={user.portalUrl}>Portal</a>
                    <button
                      className="secondary-button"
                      onClick={() => navigator.clipboard.writeText(user.portalUrl)}
                    >
                      Copy
                    </button>
                  </div>
                  {user.prefixes.length > 0 ? (
                    <ul>
                      {user.prefixes.map((prefix) => (
                        <li key={prefix}>{prefix}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
