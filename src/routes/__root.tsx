import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="p-8">
        <div className="term-label text-loss">404 · Route not found</div>
        <h1 className="text-2xl mt-2">No terminal screen at this address.</h1>
        <p className="text-sm text-muted-foreground mt-2">Use the sidebar to jump to an active module.</p>
        <Link to="/" className="mt-4 inline-block text-amber underline">← Return to home</Link>
      </div>
    </AppShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <AppShell>
      <div className="p-8">
        <div className="term-label text-loss">ERR · Screen failed to load</div>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="px-3 py-1.5 border border-amber text-amber text-xs tracking-wider uppercase"
          >Retry</button>
          <a href="/" className="px-3 py-1.5 border border-grid text-xs tracking-wider uppercase">Home</a>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nifty 100 Analyst Terminal" },
      { name: "description", content: "Bloomberg-style analytics terminal for the Nifty 100: screener, peer comparison, valuation, capital allocation and KPI trends across 92 companies." },
      { property: "og:title", content: "Nifty 100 Analyst Terminal" },
      { property: "og:description", content: "Screener · Peer groups · Valuation · Capital allocation across 92 Nifty 100 companies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
