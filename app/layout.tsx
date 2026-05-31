import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Vercel Reverse Proxy",
  description: "Locked-down serverless HTTP reverse proxy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
