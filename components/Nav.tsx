import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/site";

function SubwayLetter({
  letter,
  color,
}: {
  letter: string;
  color: "red" | "green" | "orange";
}) {
  const bg =
    color === "red"
      ? "bg-brand-red"
      : color === "green"
        ? "bg-brand-green"
        : "bg-brand-orange";
  return (
    <span
      className={`subway-letter inline-flex items-center justify-center ${bg} text-white font-black rounded-full size-[1.55em] text-[0.9em] leading-none shrink-0 shadow-sm`}
      aria-hidden
    >
      {letter}
    </span>
  );
}

export default function Nav() {
  return (
    <header>
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="logo shrink-0">
            <Image
              src="/logo.png"
              alt=""
              width={64}
              height={52}
              className="h-9 sm:h-12 w-auto"
              priority
              aria-hidden
            />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <ul className="hidden md:flex gap-4 lg:gap-5 text-sm font-black tracking-wide shrink-0">
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
              className="join-btn shrink-0 bg-brand-orange text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-2 tracking-wider hover:bg-brand-red transition-colors"
            >
              JOIN NOW
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center font-black text-brand-ink text-xl xs:text-2xl sm:text-3xl md:text-4xl tracking-tight leading-none hover:opacity-90 transition-opacity px-1"
        >
          <span className="sr-only">Narrow Path Runners</span>
          <span
            aria-hidden
            className="inline-flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1"
          >
            <span className="inline-flex items-center gap-1 sm:gap-1.5">
              <SubwayLetter letter="N" color="red" />
              <span className="text-[0.48em] tracking-wide pt-[0.15em]">
                arrow
              </span>
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5">
              <SubwayLetter letter="P" color="green" />
              <span className="text-[0.48em] tracking-wide pt-[0.15em]">ath</span>
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5">
              <SubwayLetter letter="R" color="orange" />
              <span className="text-[0.48em] tracking-wide pt-[0.15em]">
                unners
              </span>
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="md:hidden">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-black tracking-wide">
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
      <div className="npr-stripe h-1" aria-hidden="true" />
    </header>
  );
}
