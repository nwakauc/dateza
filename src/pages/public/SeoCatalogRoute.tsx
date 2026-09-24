import { getSeoPage } from "../../lib/seo/catalog.ts";
import NotFoundPage from "../../app/NotFoundPage.tsx";
import { CatalogPage } from "./CatalogPage.tsx";

export function SeoCatalogRoute({ path }: { path: string }) {
  const page = getSeoPage(path);
  if (!page) return <NotFoundPage />;
  return <CatalogPage page={page} />;
}
