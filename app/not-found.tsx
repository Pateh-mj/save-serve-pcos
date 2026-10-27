import Link from "next/link";
import { BrandMark } from "@/components/app/BrandMark";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6"><BrandMark /></div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be old or mistyped. Patients without data can still book by dialling *384#.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">Home</Link>
          <Link href="/login" className="inline-flex items-center h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
