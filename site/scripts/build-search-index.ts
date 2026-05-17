import fs from "fs";
import path from "path";
import { buildSearchIndex } from "../lib/posts";

async function main() {
  const index = await buildSearchIndex();

  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, "search-index.json");
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2), "utf-8");
  console.log(`Search index written to ${outPath} (${index.length} entries)`);
}

main().catch((err) => {
  console.error("Failed to build search index:", err);
  process.exit(1);
});
