import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAllPosts, getAllTags } from "@/lib/posts";

function cleanTag(tag: string): string {
  return tag.replace(/^#/, "");
}

export default async function TagsPage() {
  const posts = await getAllPosts();
  const tags = await getAllTags();

  // Count posts per tag
  const tagCounts = new Map<string, number>();
  for (const tag of tags) {
    tagCounts.set(tag, 0);
  }
  for (const post of posts) {
    for (const tag of post.frontMatter.tags) {
      const ct = cleanTag(tag);
      tagCounts.set(ct, (tagCounts.get(ct) || 0) + 1);
    }
  }

  const tagCategories = {
    Product: tags.filter((t) =>
      [
        "aurora", "percona", "mariadb", "heatwave",
        "tidb", "oceanbase", "frankenmysql", "mysql",
      ].includes(t)
    ),
    Module: tags.filter((t) =>
      [
        "innodb", "binlog", "replication", "optimizer",
        "executor", "parser", "dd", "ddl", "server",
      ].includes(t)
    ),
    Type: tags.filter((t) =>
      [
        "source-code", "architecture", "paper", "comparison",
        "tutorial", "learning-card", "experiment", "faq", "bulletin",
      ].includes(t)
    ),
    Difficulty: tags.filter((t) =>
      ["beginner", "intermediate", "advanced"].includes(t)
    ),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        Tags
      </h1>
      <p className="text-muted-foreground mb-8">
        Browse all {tags.length} tags across {posts.length} notes.
      </p>

      <Separator className="mb-8" />

      <div className="space-y-8">
        {Object.entries(tagCategories).map(([category, categoryTags]) => (
          <div key={category}>
            <h2 className="text-base font-semibold mb-3">{category}</h2>
            <div className="flex flex-wrap gap-2">
              {categoryTags.map((tag) => (
                <Link key={tag} href={`/tags/${tag}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5 text-sm"
                  >
                    #{tag}
                    <span className="ml-1.5 text-muted-foreground">
                      {tagCounts.get(tag)}
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
