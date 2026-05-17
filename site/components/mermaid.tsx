"use client";

import { useEffect, useRef } from "react";

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(
    `mermaid-${Math.random().toString(36).slice(2, 9)}`
  );

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark")
          ? "dark"
          : "default",
        securityLevel: "loose",
      });

      if (cancelled || !ref.current) return;

      try {
        const { svg } = await mermaid.render(idRef.current, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = `<pre class="text-destructive text-sm p-2 border border-destructive/30 rounded"><code>${chart.replace(/</g, "&lt;")}</code></pre>`;
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return <div ref={ref} className="mermaid my-6 overflow-x-auto" />;
}
