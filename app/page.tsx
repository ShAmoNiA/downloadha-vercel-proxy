const links = [
  {
    href: "/api/downloadha",
    label: "Open downloadha.com",
  },
  {
    href: "/api/downloadha?path=/category/software/",
    label: "Open software category",
  },
];

export default function Home() {
  return (
    <main>
      <section className="panel">
        <h1>Downloadha Fetch Proxy</h1>
        <p>
          A minimal Vercel-compatible HTTP fetch proxy locked to downloadha.com
          and www.downloadha.com.
        </p>
        <nav aria-label="Proxy test links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}
