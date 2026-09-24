import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { SEO_PAGES, getSeoPage } from "./src/lib/seo/catalog.ts";
import { injectRoot, injectSeoHead } from "./src/lib/seo/injectHtml.ts";
import { buildLlmsTxt } from "./src/lib/seo/llms.ts";
import { prerenderPublicPage } from "./src/lib/seo/prerenderHtml.ts";
import { buildRobotsTxt } from "./src/lib/seo/robots.ts";
import { buildSitemapXml } from "./src/lib/seo/sitemap.ts";

function write(filePath: string, contents: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function outputPathFor(distDir: string, path: string): string {
  if (path === "/") return resolve(distDir, "index.html");
  return resolve(distDir, path.replace(/^\//, ""), "index.html");
}

export function datezaSeoPlugin(): Plugin {
  let outDir = "dist";

  return {
    name: "dateza-seo",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    buildStart() {
      const publicDir = resolve(process.cwd(), "public");
      write(resolve(publicDir, "robots.txt"), buildRobotsTxt());
      write(resolve(publicDir, "sitemap.xml"), buildSitemapXml());
      write(resolve(publicDir, "llms.txt"), buildLlmsTxt());
    },
    closeBundle() {
      const distDir = resolve(process.cwd(), outDir);
      const indexPath = resolve(distDir, "index.html");
      let template: string;
      try {
        template = readFileSync(indexPath, "utf8");
      } catch {
        return;
      }

      write(resolve(distDir, "robots.txt"), buildRobotsTxt());
      write(resolve(distDir, "sitemap.xml"), buildSitemapXml());
      write(resolve(distDir, "llms.txt"), buildLlmsTxt());

      const home = getSeoPage("/");
      if (home) {
        write(indexPath, injectSeoHead(template, home));
      }

      for (const page of SEO_PAGES) {
        if (page.path === "/") continue;
        write(outputPathFor(distDir, page.path), injectRoot(injectSeoHead(template, page), prerenderPublicPage(page)));
      }
    },
  };
}
