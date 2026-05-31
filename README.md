# Downloadha Vercel Fetch Proxy

Minimal Next.js TypeScript app using the App Router. It exposes one locked-down serverless HTTP fetch proxy route for `https://downloadha.com`.

This is not a full browser, VPN, TCP, SOCKS, or Express proxy. It only fetches HTTP responses server-side, so CSS, images, JavaScript, forms, cookies, and internal links may not work perfectly through the proxy.

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

```bash
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/api/downloadha
http://localhost:3000/api/downloadha?path=/category/software/
```

## Deploy To Vercel

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Optional: add environment variables in the Vercel project settings if you want to rotate the default credential:
   - `PROXY_USERNAME`
   - `PROXY_PASSWORD` or `PROXY_PASSWORD_SHA256`
4. Keep the default Next.js framework settings.
5. Deploy.

No custom server, Express app, TCP proxy, or SOCKS proxy is required.

## Test After Deploy

Replace `your-project.vercel.app` with your Vercel domain:

```text
https://your-project.vercel.app/api/downloadha
https://your-project.vercel.app/api/downloadha?path=/category/software/
```

Your browser will ask for the Basic Auth username and password before the proxy runs.

The route only allows upstream hostnames:

- `downloadha.com`
- `www.downloadha.com`

Requests that try to use another hostname are rejected with `403`.
