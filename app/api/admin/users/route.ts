export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  AccessScope,
  getAdminAuthFailureResponse,
  normalizeAccessPrefixes,
  signAccessToken,
} from "../../_access";

type CreateUserBody = {
  username?: unknown;
  scope?: unknown;
  prefixes?: unknown;
  expiresDays?: unknown;
};

export async function POST(req: Request) {
  const authResponse = getAdminAuthFailureResponse(req, "admin dashboard");

  if (authResponse) {
    return authResponse;
  }

  let body: CreateUserBody;

  try {
    body = (await req.json()) as CreateUserBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const scope = body.scope === "all" ? "all" : "prefixes";

  if (!username) {
    return jsonError("Username is required", 400);
  }

  let prefixes: string[] = [];

  try {
    prefixes =
      scope === "prefixes"
        ? normalizeAccessPrefixes(readStringArray(body.prefixes))
        : [];
  } catch {
    return jsonError("Allowed pages must be valid absolute http(s) URLs", 400);
  }

  if (scope === "prefixes" && prefixes.length === 0) {
    return jsonError("Add at least one allowed page or choose all pages", 400);
  }

  if (prefixes.some((prefix) => !isHttpUrl(prefix))) {
    return jsonError("Allowed pages must use http or https", 400);
  }

  const expiresDays = readExpiresDays(body.expiresDays);
  const exp =
    expiresDays === null
      ? undefined
      : Math.floor(Date.now() / 1000) + expiresDays * 24 * 60 * 60;
  const token = signAccessToken({
    sub: username,
    scope: scope as AccessScope,
    prefixes,
    exp,
  });
  const origin = new URL(req.url).origin;
  const portalPath = `/portal?token=${encodeURIComponent(token)}`;
  const proxyPath = `/api/proxy?token=${encodeURIComponent(token)}`;

  return Response.json(
    {
      username,
      scope,
      prefixes,
      expiresAt: exp ? new Date(exp * 1000).toISOString() : null,
      token,
      portalUrl: `${origin}${portalPath}`,
      proxyBaseUrl: `${origin}${proxyPath}`,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value.split(/\r?\n|,/);
  }

  return [];
}

function readExpiresDays(value: unknown) {
  const days =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : 30;

  if (!Number.isFinite(days) || days <= 0) {
    return null;
  }

  return Math.min(Math.floor(days), 3650);
}

function isHttpUrl(value: string) {
  const url = new URL(value);

  return url.protocol === "http:" || url.protocol === "https:";
}

function jsonError(error: string, status: number) {
  return Response.json(
    { error },
    {
      status,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
