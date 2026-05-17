"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TocEntry } from "@/lib/posts";

function TocList({ entries }: { entries: TocEntry[] }) {
  return (
    <nav>
      <ul className="space-y-1 text-sm">
        {entries.map((entry) => (
          <li
            key={entry.id}
            style={{ paddingLeft: entry.level === 3 ? "1rem" : "0" }}
          >
            <a
              href={`#${entry.id}`}
              className="block py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function TocSidebar({ entries }: { entries: TocEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24">
          <h4 className="text-sm font-semibold mb-3">Table of Contents</h4>
          <TocList entries={entries} />
        </div>
      </aside>

      {/* Mobile: floating button + sheet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground px-3 py-2 text-sm font-medium shadow-lg hover:bg-secondary/80 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="size-4"
              strokeWidth={2}
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            TOC
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Table of Contents</SheetTitle>
            </SheetHeader>
            <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
              <TocList entries={entries} />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
