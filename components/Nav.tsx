import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/site";

export default function Nav() {
  return (
    <header>
      <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white">
        <Link href="/" className="logo shrink-0">
          <Image
            src="/logo.png"
            alt="Narrow Path Runners"
            width={64}
            height={52}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <ul className="flex gap-2 sm:gap-5 text-xs sm:text-sm font-black tracking-wide">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-ink hover:text-brand-orange transition-colors"
                >
                  [{link.label}]
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#join"
            className="join-btn bg-brand-orange text-white font-black text-xs sm:text-sm px-4 py-2 tracking-wider hover:bg-brand-red transition-colors"
          >
            JOIN NOW
          </Link>
        </nav>
      </div>
      <div className="npr-stripe h-1" aria-hidden="true" />
    </header>
  );
}
