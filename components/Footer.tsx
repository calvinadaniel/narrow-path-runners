import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto bg-white">
      <div className="npr-stripe h-1" aria-hidden="true" />
      <div className="px-4 sm:px-6 py-8 sm:py-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 sm:gap-8">
        <div className="footer-left flex items-center gap-4 text-center sm:text-left">
          <Image
            src="/logo.png"
            alt=""
            width={72}
            height={58}
            className="footer-logo h-12 sm:h-14 w-auto"
            aria-hidden
          />
          <p className="font-black text-sm leading-snug text-brand-ink">
            Narrow Path Runners
            <br />
            <span className="text-brand-ink/50 text-xs tracking-widest">
              Est. 2025
            </span>
          </p>
        </div>
        <nav aria-label="Footer" className="footer-links">
          <ul className="flex flex-wrap justify-center sm:justify-end gap-x-5 gap-y-2 text-sm font-black">
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
        </nav>
      </div>
    </footer>
  );
}
