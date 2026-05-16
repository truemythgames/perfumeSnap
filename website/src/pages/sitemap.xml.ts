import type { APIRoute } from "astro";
import { getAllPerfumes, getAllCategories } from "@/lib/perfumes";
import { getAllPosts } from "@/lib/blog";

const SITE = "https://perfumesnap.app";

export const GET: APIRoute = () => {
  const perfumes = getAllPerfumes();
  const categories = getAllCategories();
  const posts = getAllPosts();

  const urls = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/perfumes", changefreq: "weekly", priority: "0.9" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
    { loc: "/about", changefreq: "monthly", priority: "0.5" },
    { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
    { loc: "/terms", changefreq: "yearly", priority: "0.3" },
    { loc: "/support", changefreq: "monthly", priority: "0.4" },
    ...perfumes.map((p) => ({ loc: `/perfumes/${p.slug}`, changefreq: "monthly", priority: "0.8" })),
    ...categories.map((c) => ({ loc: `/perfumes/category/${c.slug}`, changefreq: "weekly", priority: "0.7" })),
    ...posts.map((p) => ({ loc: `/blog/${p.slug}`, changefreq: "monthly", priority: "0.7" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
};
