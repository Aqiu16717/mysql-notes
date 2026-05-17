import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PostCard } from "@/components/post-card";
import { getAllPosts, getAllTags } from "@/lib/posts";

function cleanTag(tag: string): string {
  return tag.replace(/^#/, "");
}

export default async function HomePage() {
  const posts = await getAllPosts();
  const tags = await getAllTags();

  // Group tags by category for the tag cloud
  const tagCategories = {
    product: tags.filter((t) =>
      [
        "aurora", "percona", "mariadb", "heatwave", "tidb",
        "oceanbase", "frankenmysql", "mysql",
      ].includes(t)
    ),
    module: tags.filter((t) =>
      [
        "innodb", "binlog", "replication", "optimizer",
        "executor", "parser", "dd", "ddl", "server",
      ].includes(t)
    ),
    type: tags.filter((t) =>
      [
        "source-code", "architecture", "paper", "comparison",
        "tutorial", "learning-card", "experiment", "faq", "bulletin",
      ].includes(t)
    ),
    difficulty: tags.filter((t) =>
      ["beginner", "intermediate", "advanced"].includes(t)
    ),
  };

  // Group posts by type for organized display
  const typeOrder = [
    "paper", "learning-card", "comparison",
    "tutorial", "source-code", "bulletin",
  ];
  const postsByType = new Map<string, typeof posts>();
  for (const post of posts) {
    const type = cleanTag(
      post.frontMatter.tags.find((t) =>
        typeOrder.includes(cleanTag(t))
      ) || "other"
    );
    if (!postsByType.has(type)) postsByType.set(type, []);
    postsByType.get(type)!.push(post);
  }

  const typeLabels: Record<string, string> = {
    paper: "Paper Cards",
    "learning-card": "Learning Cards",
    comparison: "Comparisons",
    tutorial: "Tutorials & Reports",
    "source-code": "Source Code Analyses",
    bulletin: "Bulletins",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          MySQL Ecosystem Knowledge Base
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Structured notes on MySQL internals, InnoDB, replication, optimizer,
          and the broader ecosystem — Aurora, Percona, MariaDB, TiDB,
          OceanBase, and more.
        </p>
      </section>

      <Separator className="mb-8" />

      {/* Tag Cloud */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Browse by Tag</h2>
        <div className="space-y-3">
          {Object.entries(tagCategories).map(([category, categoryTags]) => (
            <div
              key={category}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 shrink-0">
                {category}
              </span>
              {categoryTags.map((tag) => (
                <Link key={tag} href={`/tags/${tag}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors text-xs"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      <Separator className="mb-8" />

      {/* Posts by Type */}
      <section className="space-y-10">
        <h2 className="text-lg font-semibold">
          All Notes{" "}
          <span className="text-muted-foreground font-normal">
            ({posts.length})
          </span>
        </h2>
        {typeOrder.map((type) => {
          const typePosts = postsByType.get(type);
          if (!typePosts || typePosts.length === 0) return null;
          return (
            <div key={type}>
              <h3 className="text-base font-medium text-muted-foreground mb-3">
                {typeLabels[type] || type}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typePosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
