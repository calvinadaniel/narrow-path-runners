import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/results", label: "Results" },
  { href: "/gallery", label: "Gallery" },
  { href: "/roster", label: "Roster" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-brand-forest text-white">
      <Link href="/" className="font-bold text-lg">
        Narrow Path Runners
      </Link>
      <ul className="flex gap-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-brand-terracotta">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
