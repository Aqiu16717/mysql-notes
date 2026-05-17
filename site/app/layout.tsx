import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "@/components/search";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "mysql-notes — MySQL Ecosystem Knowledge Base",
    template: "%s | mysql-notes",
  },
  description:
    "A structured knowledge base covering MySQL internals, InnoDB, replication, optimizer, and the broader MySQL ecosystem — Aurora, Percona, MariaDB, TiDB, OceanBase, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-4">
                <div className="flex items-center gap-6 shrink-0">
                  <Link
                    href="/"
                    className="font-bold text-lg tracking-tight hover:text-primary transition-colors"
                  >
                    mysql-notes
                  </Link>
                  <nav className="hidden sm:flex items-center gap-4 text-sm">
                    <Link
                      href="/tags"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Tags
                    </Link>
                    <a
                      href="https://github.com/Aqiu16717/mysql-notes"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  </nav>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
                  <Search />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
              <p>
                Built with Next.js &middot; Content by{" "}
                <a
                  href="https://github.com/Aqiu16717/mysql-notes"
                  className="underline underline-offset-4 hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mysql-notes
                </a>{" "}
                team
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
