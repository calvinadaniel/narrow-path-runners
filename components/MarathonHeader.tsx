import Image from "next/image";

/** Branded header for the standalone tracker. The logo is not a link: there is nowhere to navigate to. */
export default function MarathonHeader() {
  return (
    <header>
      <div className="bg-white px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Image
            src="/npr-logo.png"
            alt="Narrow Path Runners"
            width={160}
            height={166}
            className="h-14 sm:h-16 w-auto shrink-0"
            priority
          />
          <p className="text-right text-xs sm:text-sm font-black tracking-wide uppercase leading-tight">
            <span className="block text-brand-red">TCS NYC Marathon</span>
            <span className="block text-brand-green">Runner Tracker</span>
            <span className="block text-brand-orange">Sunday, Nov 1</span>
          </p>
        </div>
      </div>
      <div className="npr-stripe h-1.5" aria-hidden="true" />
    </header>
  );
}
