"use client";

import { FormEvent, useEffect, useState } from "react";

type TokenPreview = {
  sub?: string;
  scope?: string;
  prefixes?: string[];
  exp?: number;
};

export default function PortalPage() {
  const [token, setToken] = useState("");
  const [target, setTarget] = useState("https://www.wikipedia.org/");
  const [preview, setPreview] = useState<TokenPreview | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextToken = params.get("token") || "";
    setToken(nextToken);
    setPreview(readTokenPreview(nextToken));
  }, []);

  function openProxy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const url = `/api/proxy?token=${encodeURIComponent(token)}&url=${encodeURIComponent(target)}`;
    window.location.href = url;
  }

  return (
    <main>
      <section className="panel portal-panel">
        <p className="eyebrow">User Portal</p>
        <h1>Open Through Proxy</h1>

        {preview ? (
          <div className="access-summary">
            <p>
              User: <strong>{preview.sub}</strong>
            </p>
            <p>
              Access:{" "}
              <strong>
                {preview.scope === "all" ? "all pages" : "specific pages"}
              </strong>
            </p>
            {preview.exp ? (
              <p>Expires: {new Date(preview.exp * 1000).toLocaleString()}</p>
            ) : null}
          </div>
        ) : (
          <p className="muted">No valid-looking token is attached to this link.</p>
        )}

        <form className="admin-form" onSubmit={openProxy}>
          <label>
            Target URL
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="https://example.com/"
            />
          </label>
          <button type="submit">Open URL</button>
        </form>

        {preview?.prefixes?.length ? (
          <div className="allowed-list">
            <h2>Allowed Pages</h2>
            <ul>
              {preview.prefixes.map((prefix) => (
                <li key={prefix}>{prefix}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function readTokenPreview(token: string) {
  const payload = token.split(".")[0];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded)) as TokenPreview;
  } catch {
    return null;
  }
}
