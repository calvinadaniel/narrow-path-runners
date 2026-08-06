import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAboutContent } from "@/lib/about";

export default function AboutPage() {
  const content = getAboutContent();
  return (
    <>
      <section
        id="hero"
        className="relative w-full min-h-[min(58vh,560px)] flex items-end justify-center overflow-hidden text-center"
      >
        <Image
          src="/who-we-are-hero.png"
          alt="Narrow Path Runners club members posing together after a run"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-b from-transparent via-brand-cream/75 to-brand-cream"
          aria-hidden
        />
        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-10 sm:pb-14">
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl uppercase tracking-tight leading-[1.05]">
            Who We Are
          </h1>
        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 space-y-4 break-words">
        <MDXRemote source={content} />
      </main>
    </>
  );
}
