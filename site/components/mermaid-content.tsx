"use client";

import { useMemo } from "react";
import { Mermaid } from "./mermaid";

interface MermaidContentProps {
  html: string;
}

export function MermaidContent({ html }: MermaidContentProps) {
  const parts = useMemo(() => {
    // Split HTML by mermaid code blocks
    const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;

    const result: Array<{ type: "html" | "mermaid"; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = mermaidRegex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: "html",
          content: html.slice(lastIndex, match.index),
        });
      }
      result.push({
        type: "mermaid",
        content: match[1]
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      result.push({ type: "html", content: html.slice(lastIndex) });
    }

    return result;
  }, [html]);

  return (
    <>
      {parts.map((part, i) =>
        part.type === "mermaid" ? (
          <Mermaid key={i} chart={part.content} />
        ) : (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        )
      )}
    </>
  );
}
