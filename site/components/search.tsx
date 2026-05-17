"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { Input } from "@/components/ui/input";

interface SearchResult {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [index, setIndex] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const fuseRef = useRef<Fuse<SearchResult> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        setIndex(data);
        fuseRef.current = new Fuse(data, {
          keys: ["title", "excerpt", "tags"],
          threshold: 0.4,
          ignoreLocation: true,
          includeScore: true,
        });
      });
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (!q.trim() || !fuseRef.current) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      const r = fuseRef.current.search(q).slice(0, 10);
      setResults(r.map((x) => x.item));
      setIsOpen(true);
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 150);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Input
        type="search"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setIsOpen(true)}
        className="w-full"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <a
              key={r.slug}
              href={`/posts/${r.slug}`}
              className="block p-3 hover:bg-accent transition-colors border-b border-border last:border-0"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
            >
              <div className="font-medium text-sm">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {r.excerpt.slice(0, 120)}
              </div>
              <div className="flex gap-1 mt-1.5">
                {r.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
