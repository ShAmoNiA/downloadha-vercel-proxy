const links = [
  {
    href: "/api/proxy",
    label: "Open configured upstream",
  },
  {
    href: "/api/proxy?path=/category/software/",
    label: "Open configured path",
  },
  {
    href: "/api/downloadha",
    label: "Legacy downloadha alias",
  },
  {
    href: "/admin",
    label: "Admin dashboard",
  },
];

export default function Home() {
  return (
    <main>
      <section className="panel">
        <h1>Vercel Reverse Proxy</h1>
        <p>
          A minimal Vercel-compatible HTTP reverse proxy with Basic Auth,
          debug errors, and support for any authenticated HTTP(S) target.
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
