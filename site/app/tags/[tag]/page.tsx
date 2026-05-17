import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostCard } from "@/components/post-card";
import { getAllPosts, getAllTags, getPostsByTag } from "@/lib/posts";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} — Tag`,
    description: `Browse all notes tagged with #${tag}`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const [posts, allTags] = await Promise.all([
    getPostsByTag(tag),
    getAllTags(),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/tags"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All Tags
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        <Badge variant="secondary" className="text-base px-3 py-1.5 mr-2">
          #{tag}
        </Badge>
        <span className="text-muted-foreground font-normal">
          {posts.length} note{posts.length !== 1 ? "s" : ""}
        </span>
      </h1>

      <Separator className="my-6" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
