"use client";
import { ErrorScreen } from "@/components/app/ErrorScreen";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background px-4">
      <ErrorScreen error={error} reset={reset} />
    </div>
  );
}
