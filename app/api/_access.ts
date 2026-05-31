import { createHash, createHmac, timingSafeEqual } from "crypto";

export type AccessScope = "all" | "prefixes";

export type AccessPayload = {
  sub: string;
  scope: AccessScope;
  prefixes: string[];
  exp?: number;
};

const fallbackUsername = "shayan";
const fallbackPasswordHash =
  "e91155a519a316e015fb2b29a799ffa9a50d0dc06ecf08559941172bb867ebe9";

export function getAdminAuthFailureResponse(
  req: Request,
  realm = "reverse proxy",
) {
  if (isAdminRequest(req)) {
    return null;
  }

  return Response.json(
    { error: "Authentication required" },
    {
      status: 401,
      headers: {
        "cache-control": "no-store",
        "www-authenticate": `Basic realm="${realm}"`,
      },
    },
  );
}

export function isAdminRequest(req: Request) {
  const expectedUsername = process.env.PROXY_USERNAME || fallbackUsername;
  const expectedPasswordHash =
    process.env.PROXY_PASSWORD_SHA256 ||
    hashPassword(process.env.PROXY_PASSWORD) ||
    fallbackPasswordHash;

  const credentials = parseBasicAuth(req.headers.get("authorization"));

  return (
    !!credentials &&
    safeEqual(credentials.username, expectedUsername) &&
    safeEqual(hashPassword(credentials.password) || "", expectedPasswordHash)
  );
}

export function signAccessToken(payload: AccessPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra) {
    return null;
  }

  if (!safeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AccessPayload;

    if (!isAccessPayload(payload)) {
      return null;
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length);
  }

  return null;
}

export function getTokenFromRequest(req: Request, requestUrl: URL) {
  return (
    requestUrl.searchParams.get("token") ||
    requestUrl.searchParams.get("access_token") ||
    getBearerToken(req)
  );
}

export function canAccessTarget(payload: AccessPayload, target: URL) {
  if (payload.scope === "all") {
    return true;
  }

  const normalizedTarget = normalizeUrlForAccess(target.toString());

  return payload.prefixes.some((prefix) =>
    normalizedTarget.startsWith(normalizeUrlForAccess(prefix)),
  );
}

export function normalizeAccessPrefixes(prefixes: string[]) {
  return prefixes
    .map((prefix) => prefix.trim())
    .filter(Boolean)
    .map((prefix) => normalizeUrlForAccess(prefix));
}

function isAccessPayload(value: unknown): value is AccessPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as AccessPayload;

  return (
    typeof payload.sub === "string" &&
    (payload.scope === "all" || payload.scope === "prefixes") &&
    Array.isArray(payload.prefixes) &&
    payload.prefixes.every((prefix) => typeof prefix === "string") &&
    (payload.exp === undefined || typeof payload.exp === "number")
  );
}

function normalizeUrlForAccess(value: string) {
  const url = new URL(value);
  url.hash = "";

  if (url.pathname === "") {
    url.pathname = "/";
  }

  return url.toString();
}

function sign(value: string) {
  return createHmac("sha256", getTokenSecret()).update(value).digest("base64url");
}

function getTokenSecret() {
  return (
    process.env.PROXY_TOKEN_SECRET ||
    process.env.PROXY_PASSWORD_SHA256 ||
    hashPassword(process.env.PROXY_PASSWORD) ||
    fallbackPasswordHash
  );
}

function parseBasicAuth(authorization: string | null) {
  if (!authorization?.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(authorization.slice("Basic ".length), "base64")
    .toString("utf8");
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function hashPassword(password: string | undefined) {
  if (!password) {
    return null;
  }

  return createHash("sha256").update(password).digest("hex");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}
