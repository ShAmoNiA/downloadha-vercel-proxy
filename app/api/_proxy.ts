import {
  canAccessTarget,
  getAdminAuthFailureResponse,
  getTokenFromRequest,
  isAdminRequest,
  verifyAccessToken,
} from "./_access";

type ProxyConfig = {
  defaultBaseUrl: string;
  allowedHostnames?: string[];
  authRealm?: string;
};

const browserHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function handleProxyGET(req: Request, config: ProxyConfig) {
  let target: URL;
  let requestUrl: URL;

  try {
    requestUrl = new URL(req.url);
    target = resolveTargetUrl(requestUrl, config.defaultBaseUrl);
  } catch (error) {
    return Response.json(
      {
        error: "Invalid target URL",
        details: serializeError(error),
      },
      {
        status: 400,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return Response.json(
      { error: "Only http and https URLs are supported" },
      {
        status: 400,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  const admin = isAdminRequest(req);
  const tokenPayload = verifyAccessToken(getTokenFromRequest(req, requestUrl));

  if (!admin && !tokenPayload) {
    return (
      getAdminAuthFailureResponse(req, config.authRealm) ||
      Response.json(
        { error: "Authentication required" },
        {
          status: 401,
          headers: {
            "cache-control": "no-store",
          },
        },
      )
    );
  }

  if (!admin && tokenPayload && !canAccessTarget(tokenPayload, target)) {
    return Response.json(
      {
        error: "User is not allowed to access this target",
        user: tokenPayload.sub,
      },
      {
        status: 403,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  if (config.allowedHostnames?.length) {
    const allowedHostnames = new Set(config.allowedHostnames);

    if (!allowedHostnames.has(target.hostname)) {
      return Response.json(
        {
          error: "Target hostname is not allowed",
          allowedHostnames: config.allowedHostnames,
        },
        {
          status: 403,
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    }
  }

  let upstream: Response;

  try {
    upstream = await fetch(target.toString(), {
      method: "GET",
      cache: "no-store",
      headers: browserHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch upstream",
        target: target.toString(),
        details: serializeError(error),
      },
      {
        status: 502,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function readDefaultBaseUrl(defaultBaseUrl: string) {
  return process.env.PROXY_UPSTREAM_BASE_URL || defaultBaseUrl;
}

function resolveTargetUrl(requestUrl: URL, defaultBaseUrl: string) {
  const url = requestUrl.searchParams.get("url");
  const path = requestUrl.searchParams.get("path") || "/";

  if (url) {
    return new URL(url);
  }

  return new URL(path, defaultBaseUrl);
}

function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: serializeCause((error as Error & { cause?: unknown }).cause),
  };
}

function serializeCause(cause: unknown): unknown {
  if (!cause) {
    return null;
  }

  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
      ...Object.fromEntries(
        Object.entries(cause).map(([key, value]) => [key, String(value)]),
      ),
    };
  }

  if (typeof cause === "object") {
    return Object.fromEntries(
      Object.entries(cause).map(([key, value]) => [key, String(value)]),
    );
  }

  return String(cause);
}
