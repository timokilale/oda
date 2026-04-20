import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";

export default function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <div className="workspace-page">
      <div className="app-shell">
        <section className="auth-shell" style={{ textAlign: "center", paddingTop: "80px" }}>
          <div className="surface panel stack-md">
            <p className="eyebrow">404</p>
            <h1 className="page-title">Page not found</h1>
            <p className="page-subtitle">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="action-row" style={{ justifyContent: "center" }}>
              <Link to="/" className="button button-confirm">
                Go to dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
