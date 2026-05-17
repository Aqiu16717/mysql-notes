import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import type { Post } from "@/lib/posts";

function cleanTag(tag: string): string {
  return tag.replace(/^#/, "");
}

function getTagVariant(tag: string): "default" | "secondary" | "outline" {
  const t = cleanTag(tag);
  if (["beginner", "intermediate", "advanced"].includes(t)) return "outline";
  if (["paper", "learning-card", "tutorial", "source-code", "bulletin", "comparison", "experiment", "faq", "architecture"].includes(t)) return "secondary";
  return "default";
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
            {post.frontMatter.title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {post.excerpt}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap items-center gap-2 pt-0">
          {post.frontMatter.tags.map((tag) => (
            <Badge key={tag} variant={getTagVariant(tag)} className="text-xs">
              {cleanTag(tag)}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {post.frontMatter.date}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
