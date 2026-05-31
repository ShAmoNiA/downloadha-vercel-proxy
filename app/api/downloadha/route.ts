export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { handleProxyGET } from "../_proxy";

export async function GET(req: Request) {
  return handleProxyGET(req, {
    defaultBaseUrl: "https://downloadha.com",
    allowedHostnames: ["downloadha.com", "www.downloadha.com"],
    authRealm: "downloadha proxy",
  });
}
