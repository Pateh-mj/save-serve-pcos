"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Shown by error.tsx boundaries: a calm message and a retry, never a stack trace. */
export function ErrorScreen({ error, reset, homeHref = "/" }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto my-16 bg-card border border-border rounded-xl p-8 text-center shadow-xs">
      <span className="mx-auto mb-4 w-12 h-12 rounded-full bg-warning-soft inline-flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-warning" strokeWidth={1.75} />
      </span>
      <h1 className="text-lg font-semibold text-foreground">This page couldn&apos;t load</h1>
      <p className="text-sm text-muted-foreground mt-1.5">
        The connection to the server may have dropped. Your data is safe. Try again, or dial *384# from any phone.
      </p>
      {error.digest && <p className="text-xs text-muted-foreground mt-3">Reference: {error.digest}</p>}
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={reset} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
        <Link href={homeHref} className="inline-flex items-center h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
