export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  handleProxyGET,
  readDefaultBaseUrl,
} from "../_proxy";

export async function GET(req: Request) {
  return handleProxyGET(req, {
    defaultBaseUrl: readDefaultBaseUrl("https://downloadha.com"),
  });
}
