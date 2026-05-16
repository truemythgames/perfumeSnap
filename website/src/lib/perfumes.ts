import type { PerfumeData } from "./structured-data";

const perfumeModules = import.meta.glob<PerfumeData>("../content/perfumes/*.json", { eager: true, import: "default" });

let _cache: PerfumeData[] | null = null;

function loadAll(): PerfumeData[] {
  if (_cache) return _cache;
  _cache = Object.values(perfumeModules);
  return _cache;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getAllPerfumes(): PerfumeData[] {
  return loadAll();
}

export function getPerfumeBySlug(slug: string): PerfumeData | null {
  return loadAll().find((p) => p.slug === slug) ?? null;
}

export function getPerfumesByCategory(slug: string): PerfumeData[] {
  return loadAll().filter(
    (p) =>
      slugify(p.fragranceFamily) === slug ||
      p.occasions.some((o) => slugify(o) === slug) ||
      p.seasons.some((s) => slugify(s) === slug) ||
      slugify(p.gender) === slug
  );
}

export function getAllCategories(): { slug: string; name: string; count: number }[] {
  const perfumes = loadAll();
  const catMap = new Map<string, { name: string; count: number }>();

  for (const p of perfumes) {
    const famSlug = slugify(p.fragranceFamily);
    const existing = catMap.get(famSlug);
    catMap.set(famSlug, { name: p.fragranceFamily, count: (existing?.count ?? 0) + 1 });

    for (const s of p.seasons) {
      const sk = slugify(s);
      const ex = catMap.get(sk);
      catMap.set(sk, { name: s, count: (ex?.count ?? 0) + 1 });
    }

    const gk = slugify(p.gender);
    if (gk && gk !== "unisex") {
      const ex = catMap.get(gk);
      catMap.set(gk, { name: p.gender, count: (ex?.count ?? 0) + 1 });
    }
  }

  return Array.from(catMap.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count);
}
