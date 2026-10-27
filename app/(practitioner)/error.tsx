"use client";
import { ErrorScreen } from "@/components/app/ErrorScreen";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} homeHref="/practitioner/dashboard" />;
}
