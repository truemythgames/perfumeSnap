export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  content: string;
}

const postModules = import.meta.glob<BlogPost>("../content/blog/*.json", { eager: true, import: "default" });

let _cache: BlogPost[] | null = null;

function loadAll(): BlogPost[] {
  if (_cache) return _cache;
  _cache = Object.values(postModules).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return _cache;
}

export function getAllPosts(): BlogPost[] {
  return loadAll();
}

export function getPostBySlug(slug: string): BlogPost | null {
  return loadAll().find((p) => p.slug === slug) ?? null;
}
