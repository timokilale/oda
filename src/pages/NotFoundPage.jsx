import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";

export default function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-full max-w-[520px] mx-auto px-4 text-center">
        <div className="rounded-xl border border-border bg-card p-6 grid gap-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">404</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
