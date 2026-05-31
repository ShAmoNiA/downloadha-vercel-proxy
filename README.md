# Vercel Reverse Proxy

Minimal Next.js TypeScript app using the App Router. It exposes a locked-down serverless HTTP reverse proxy that can be pointed at one or more allowed upstream hostnames.

This is not a full browser, VPN, TCP, SOCKS, or Express proxy. It only fetches HTTP responses server-side, so CSS, images, JavaScript, forms, cookies, and internal links may not work perfectly through the proxy.

By default, the configured upstream is `https://downloadha.com`, but the generic route is not hardcoded to that one site.

## Install

```bash
npm install
```

## Run Locally

Create a local environment file:

```bash
cp .env.example .env.local
```

Set `PROXY_PASSWORD` to a private password. The route uses browser Basic Auth, with username `shayan` unless you set a different `PROXY_USERNAME`.

Set the upstream and allowlist:

```bash
PROXY_UPSTREAM_BASE_URL=https://downloadha.com
PROXY_ALLOWED_HOSTS=downloadha.com,www.downloadha.com
```

```bash
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/api/proxy
http://localhost:3000/api/proxy?path=/category/software/
http://localhost:3000/api/downloadha
http://localhost:3000/api/downloadha?path=/category/software/
```

## Deploy To Vercel

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Optional: add environment variables in the Vercel project settings if you want to rotate the default credential:
   - `PROXY_USERNAME`
   - `PROXY_PASSWORD` or `PROXY_PASSWORD_SHA256`
   - `PROXY_UPSTREAM_BASE_URL`
   - `PROXY_ALLOWED_HOSTS`
4. Keep the default Next.js framework settings.
5. Deploy.

No custom server, Express app, TCP proxy, or SOCKS proxy is required.

## Test After Deploy

Replace `your-project.vercel.app` with your Vercel domain:

```text
https://your-project.vercel.app/api/downloadha
https://your-project.vercel.app/api/downloadha?path=/category/software/
https://your-project.vercel.app/api/proxy
https://your-project.vercel.app/api/proxy?path=/category/software/
```

Your browser will ask for the Basic Auth username and password before the proxy runs.

The generic route supports:

- `GET /api/proxy` to fetch `PROXY_UPSTREAM_BASE_URL`
- `GET /api/proxy?path=/some/path` to resolve a path against `PROXY_UPSTREAM_BASE_URL`
- `GET /api/proxy?url=https://allowed.example/some/path` to fetch an absolute URL only if its hostname appears in `PROXY_ALLOWED_HOSTS`

The route only allows upstream hostnames from `PROXY_ALLOWED_HOSTS`. The default allowlist is:

- `downloadha.com`
- `www.downloadha.com`

Requests that try to use another hostname are rejected with `403`.

`/api/downloadha` is kept as a legacy shortcut that always uses the `downloadha.com` allowlist.
