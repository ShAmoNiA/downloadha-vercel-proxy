export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedHostnames = new Set(["downloadha.com", "www.downloadha.com"]);

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path") || "/";
  const target = new URL(path, "https://downloadha.com");

  if (!allowedHostnames.has(target.hostname)) {
    return Response.json(
      { error: "Only downloadha.com is allowed" },
      {
        status: 403,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(target.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to fetch downloadha.com" },
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
