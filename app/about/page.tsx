import { MDXRemote } from "next-mdx-remote/rsc";
import { getAboutContent } from "@/lib/about";

export default function AboutPage() {
  const content = getAboutContent();
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-4">
      <MDXRemote source={content} />
    </main>
  );
}
