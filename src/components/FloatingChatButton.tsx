import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChatSurface } from "./ChatSurface";

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Don't show on /s2 (full page chat already visible)
  if (pathname === "/s2") return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[92vw] max-w-sm overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="text-sm font-semibold text-foreground">Ask Stu</div>
            <div className="flex items-center gap-3">
              <Link
                to="/s2"
                onClick={() => setOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Full page
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          </div>
          <ChatSurface variant="panel" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <span className="text-lg font-semibold">S2</span>
      </button>
    </>
  );
}
