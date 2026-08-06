import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/site";

export default function Nav() {
  return (
    <header>
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link
          href="/"
          className="shrink-0 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/npr-logo.png"
            alt="Narrow Path Runners"
            width={160}
            height={166}
            className="h-11 sm:h-12 w-auto"
            priority
          />
        </Link>

        <nav aria-label="Primary" className="ml-auto">
          <ul className="flex flex-wrap justify-end gap-x-5 sm:gap-x-7 gap-y-1 text-sm font-black tracking-wide">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-ink hover:text-brand-red transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="npr-stripe h-1" aria-hidden="true" />
    </header>
  );
}
