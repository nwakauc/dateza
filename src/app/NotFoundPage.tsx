import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PublicChrome } from "../pages/public/PublicChrome.tsx";

const HOME_TITLE = "DateZA — Meet someone who chooses you.";
const NOT_FOUND_TITLE = "Page not found — DateZA";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = NOT_FOUND_TITLE;
    return () => {
      document.title = HOME_TITLE;
    };
  }, []);

  return (
    <PublicChrome>
      <main className="public-status public-status--with-chrome" id="main-content">
        <h1 className="public-status__title">Page not found</h1>
        <p className="public-status__body">
          That address is not a DateZA page. Check the link, or go back to the home page.
        </p>
        <Link className="public-status__home" to="/">
          Back to home
        </Link>
      </main>
    </PublicChrome>
  );
}
