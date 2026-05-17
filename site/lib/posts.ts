import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import GithubSlugger from "github-slugger";

export interface PostFrontMatter {
  title: string;
  date: string;
  tags: string[];
  source: string[];
  version: string;
  author: string;
  // Optional extended fields
  paper?: {
    venue: string;
    year: number;
    maturity: string;
    keywords: string;
  };
  product_mapping?: Record<string, string>;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface Post {
  slug: string;
  filename: string;
  frontMatter: PostFrontMatter;
  content: string; // raw markdown
  html: string; // rendered HTML
  toc: TocEntry[];
  excerpt: string; // first 200 chars of body text
  readingTime: number; // minutes
}

export interface SearchIndexEntry {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  author: string;
}

const CONTENT_DIR = (() => {
  const local = path.resolve(process.cwd(), "./content");
  if (fs.existsSync(local)) return local;
  return path.resolve(process.cwd(), "../content");
})();

// Strip # prefix from tag strings
function cleanTag(tag: string): string {
  return tag.replace(/^#/, "");
}

// Generate a slug from filename: "2026-05-16-mysql-bwtree.md" -> "mysql-bwtree"
function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

// Normalize source field to always be a string array
function normalizeSource(src: unknown): string[] {
  if (!src) return [];
  if (Array.isArray(src)) {
    return src.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        // Handle structured source entries like { type: "bulletin", ref: "..." }
        // or { url: "https://..." }
        const obj = item as Record<string, string>;
        if (obj.url) return obj.url;
        if (obj.ref) return obj.ref;
        return JSON.stringify(obj);
      }
      return String(item);
    });
  }
  return [String(src)];
}

// Normalize tags: ensure string array, strip leading # if present
function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t));
  }
  if (typeof tags === "string") {
    return tags.split(/,\s*/).map((t) => t.trim());
  }
  return [];
}

// Extract TOC headings from markdown, using github-slugger for IDs
// that match what rehype-slug generates
function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const headings: TocEntry[] = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Strip inline code/html tags for slug generation (same as rehype-slug)
    const cleanText = text.replace(/<[^>]*>/g, "").replace(/`/g, "");
    const id = slugger.slug(cleanText);

    headings.push({ id, text, level });
  }

  return headings;
}

// Generate excerpt from HTML
function generateExcerpt(html: string, maxLength = 200): string {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

// Estimate reading time
function estimateReadingTime(text: string): number {
  const charCount = text.replace(/<[^>]*>/g, "").length;
  // Chinese: ~300 chars/min; English: ~200 words/min. Rough estimate.
  const minutes = charCount / 400;
  return Math.max(1, Math.ceil(minutes));
}

// Render markdown to HTML with heading IDs (via rehype-slug)
async function renderMarkdown(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return result.toString();
}

// Parse YAML front matter from a markdown file.
// Pre-processes tag lines to handle # prefix (YAML comment character).
function parseFrontMatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, content: raw };
  }
  let yamlStr = match[1];

  // Pre-process: quote bare #tags in flow/block sequences so YAML doesn't
  // treat # as a comment. Matches patterns like [#mysql, #innodb] or
  //   - #mysql
  yamlStr = yamlStr.replace(/#([a-z][a-z0-9-]*)/gi, '"#$1"');

  const data = (yaml.load(yamlStr) as Record<string, unknown>) || {};
  const content = raw.slice(match[0].length);
  return { data, content };
}

// Parse a single post file
async function parsePostFile(filename: string): Promise<Post | null> {
  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const slug = slugFromFilename(filename);

  let data: Record<string, unknown>;
  let content: string;

  try {
    const parsed = parseFrontMatter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (err) {
    console.warn(`Failed to parse front matter for ${filename}:`, (err as Error).message);
    return null;
  }

  const frontMatter: PostFrontMatter = {
    title: String(data.title || slug),
    date: String(data.date || ""),
    tags: normalizeTags(data.tags),
    source: normalizeSource(data.source),
    version: String(data.version || ""),
    author: String(data.author || ""),
    paper: data.paper as PostFrontMatter["paper"] | undefined,
    product_mapping: data.product_mapping as PostFrontMatter["product_mapping"] | undefined,
  };

  const html = await renderMarkdown(content);
  const toc = extractToc(content);
  const excerpt = generateExcerpt(html);
  const readingTime = estimateReadingTime(html);

  return {
    slug,
    filename,
    frontMatter,
    content,
    html,
    toc,
    excerpt,
    readingTime,
  };
}

// Read and parse all posts
export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    return [];
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && f !== "tags.md");

  const posts: Post[] = [];

  for (const filename of files) {
    const post = await parsePostFile(filename);
    if (post) {
      posts.push(post);
    }
  }

  // Sort by date descending
  posts.sort(
    (a, b) =>
      new Date(b.frontMatter.date).getTime() -
      new Date(a.frontMatter.date).getTime()
  );

  return posts;
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}

// Get all unique tags (cleaned, no # prefix)
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.frontMatter.tags) {
      tagSet.add(cleanTag(tag));
    }
  }
  return Array.from(tagSet).sort();
}

// Get posts by tag
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((post) =>
    post.frontMatter.tags.some((t) => cleanTag(t) === tag)
  );
}

// Get related posts (shared tags, excluding current)
export async function getRelatedPosts(
  slug: string,
  limit = 3
): Promise<Post[]> {
  const posts = await getAllPosts();
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];

  const currentTags = new Set(
    current.frontMatter.tags.map(cleanTag)
  );

  const scored = posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const score = p.frontMatter.tags.filter((t) =>
        currentTags.has(cleanTag(t))
      ).length;
      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.post);
}

// Get prev/next posts by date
export async function getPrevNextPosts(slug: string): Promise<{
  prev: Post | null;
  next: Post | null;
}> {
  const posts = await getAllPosts();
  // Posts are sorted newest first. Prev = older, Next = newer.
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
    next: idx > 0 ? posts[idx - 1] : null,
  };
}

// Build search index
export async function buildSearchIndex(): Promise<SearchIndexEntry[]> {
  const posts = await getAllPosts();
  return posts.map((p) => ({
    slug: p.slug,
    title: p.frontMatter.title,
    date: p.frontMatter.date,
    tags: p.frontMatter.tags.map(cleanTag),
    excerpt: p.excerpt,
    author: p.frontMatter.author,
  }));
}
