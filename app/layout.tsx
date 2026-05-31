import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Downloadha Fetch Proxy",
  description: "Locked-down serverless fetch proxy for downloadha.com",
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
