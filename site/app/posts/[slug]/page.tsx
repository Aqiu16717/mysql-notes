import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TocSidebar } from "@/components/toc";
import { MermaidContent } from "@/components/mermaid-content";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  getPrevNextPosts,
} from "@/lib/posts";
import type { Metadata } from "next";

const GITHUB_REPO = "https://github.com/Aqiu16717/mysql-notes";
const CONTENT_BASE = `${GITHUB_REPO}/blob/main/content`;

function cleanTag(tag: string): string {
  return tag.replace(/^#/, "");
}

function getTagVariant(tag: string): "default" | "secondary" | "outline" {
  const t = cleanTag(tag);
  if (["beginner", "intermediate", "advanced"].includes(t)) return "outline";
  if (["paper", "learning-card", "tutorial", "source-code", "bulletin", "comparison", "experiment", "faq", "architecture"].includes(t)) return "secondary";
  return "default";
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.frontMatter.title,
    description: post.excerpt,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug);
  const { prev, next } = await getPrevNextPosts(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Main content */}
        <article className="flex-1 min-w-0 max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              {post.frontMatter.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
              <time dateTime={post.frontMatter.date}>
                {post.frontMatter.date}
              </time>
              <span>·</span>
              <span>{post.readingTime} min read</span>
              <span>·</span>
              <span>{post.frontMatter.author}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {post.frontMatter.tags.map((tag) => (
                <Link key={tag} href={`/tags/${cleanTag(tag)}`}>
                  <Badge
                    variant={getTagVariant(tag)}
                    className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                  >
                    {cleanTag(tag)}
                  </Badge>
                </Link>
              ))}
            </div>
            {post.frontMatter.version && (
              <p className="text-xs text-muted-foreground mt-3">
                Version: {post.frontMatter.version}
              </p>
            )}
          </header>

          <Separator className="mb-8" />

          {/* Article body */}
          <div className="article-content max-w-none">
            <MermaidContent html={post.html} />
          </div>

          <Separator className="my-8" />

          {/* Sources */}
          {post.frontMatter.source &&
            post.frontMatter.source.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold mb-2">Sources</h3>
                <ul className="space-y-1">
                  {post.frontMatter.source.map((src, i) => (
                    <li key={i} className="text-sm">
                      <a
                        href={
                          src.startsWith("http") ? src : `${GITHUB_REPO}/${src}`
                        }
                        className="text-primary underline underline-offset-4 hover:no-underline break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {src}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Footer nav */}
          <footer className="space-y-6">
            {/* Prev / Next */}
            <nav className="grid grid-cols-2 gap-4">
              {prev ? (
                <Link
                  href={`/posts/${prev.slug}`}
                  className="group block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">
                    ← Previous
                  </span>
                  <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors line-clamp-1">
                    {prev.frontMatter.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/posts/${next.slug}`}
                  className="group block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors text-right"
                >
                  <span className="text-xs text-muted-foreground">
                    Next →
                  </span>
                  <p className="text-sm font-medium mt-1 group-hover:text-primary transition-colors line-clamp-1">
                    {next.frontMatter.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
            </nav>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Related Posts</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((rp) => (
                    <Link
                      key={rp.slug}
                      href={`/posts/${rp.slug}`}
                      className="block p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <p className="text-sm font-medium line-clamp-2">
                        {rp.frontMatter.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rp.frontMatter.date}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Edit this page */}
            <div className="text-sm">
              <a
                href={`${CONTENT_BASE}/${post.filename}`}
                className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Edit this page on GitHub
              </a>
            </div>
          </footer>
        </article>

        {/* Desktop TOC sidebar */}
        <TocSidebar entries={post.toc} />
      </div>
    </div>
  );
}
