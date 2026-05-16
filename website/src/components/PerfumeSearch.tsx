import { useState, useMemo } from "react";
import type { PerfumeData } from "@/lib/structured-data";

const VIBE_MAP: Record<string, string> = {
  "Aromatic Fougère": "Fresh & Bold",
  "Woody Aromatic": "Refined & Elegant",
  "Oriental Floral": "Rich & Sensual",
  "Fruity Chypre": "Confident & Modern",
  "Aquatic Aromatic": "Clean & Breezy",
  "Amber Floral": "Warm & Luxurious",
  "Oriental Spicy": "Dark & Sophisticated",
  "Amber Vanilla": "Sweet & Magnetic",
};

function vibeLabel(family: string): string {
  return VIBE_MAP[family] || family;
}

const GENDER_FILTERS = ["All", "Men", "Women", "Unisex"] as const;
const SORT_OPTIONS = [
  { value: "name", label: "Name A-Z" },
  { value: "brand", label: "Brand A-Z" },
  { value: "price-low", label: "Price: Low" },
  { value: "price-high", label: "Price: High" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

function parsePriceLow(range: string): number {
  const m = range.match(/\$(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function PerfumeRow({ perfume }: { perfume: PerfumeData }) {
  const topNotes = perfume.topNotes.slice(0, 3).join(", ");

  return (
    <a
      href={`/perfumes/${perfume.slug}`}
      className="group flex items-center gap-4 rounded-xl bg-surface border border-border p-4 hover:border-primary/40 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/15 to-accent/5 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-lg font-bold text-primary/60 select-none">
          {perfume.brand.charAt(0)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {perfume.name}
        </h3>
        <p className="text-xs text-muted truncate">
          {perfume.brand} · {topNotes}
        </p>
      </div>

      <span className="hidden md:block text-[11px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
        {vibeLabel(perfume.fragranceFamily)}
      </span>

      <svg
        className="w-4 h-4 text-muted-dark group-hover:text-primary transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

const PAGE_SIZE = 30;

export default function PerfumeSearch({ perfumes }: { perfumes: PerfumeData[] }) {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const brands = useMemo(() => {
    const set = new Set(perfumes.map((p) => p.brand));
    return Array.from(set).sort();
  }, [perfumes]);

  const [brand, setBrand] = useState<string>("All");

  const filtered = useMemo(() => {
    let list = perfumes;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.topNotes.some((n) => n.toLowerCase().includes(q)) ||
          p.middleNotes.some((n) => n.toLowerCase().includes(q)) ||
          p.baseNotes.some((n) => n.toLowerCase().includes(q))
      );
    }

    if (gender !== "All") {
      list = list.filter((p) => p.gender.toLowerCase() === gender.toLowerCase());
    }

    if (brand !== "All") {
      list = list.filter((p) => p.brand === brand);
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "brand":
          return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
        case "price-low":
          return parsePriceLow(a.priceRange) - parsePriceLow(b.priceRange);
        case "price-high":
          return parsePriceLow(b.priceRange) - parsePriceLow(a.priceRange);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [perfumes, query, gender, brand, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-dark pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          placeholder="Search by name, brand, or note..."
          className="w-full rounded-xl bg-surface border border-border pl-12 pr-4 py-3.5 text-foreground placeholder:text-muted-dark focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {GENDER_FILTERS.map((g) => (
          <button
            key={g}
            onClick={() => { setGender(g); setVisibleCount(PAGE_SIZE); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              gender === g
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-surface border-border text-muted hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {g}
          </button>
        ))}

        <span className="w-px h-5 bg-border mx-1 hidden sm:block" />

        <select
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setVisibleCount(PAGE_SIZE); }}
          className="text-xs bg-surface border border-border text-muted rounded-full px-3 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer"
        >
          <option value="All">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-xs bg-surface border border-border text-muted rounded-full px-3 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer ml-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-dark mb-3">
        {filtered.length} {filtered.length === 1 ? "perfume" : "perfumes"}
        {query && ` matching "${query}"`}
      </p>

      {/* List */}
      {visible.length > 0 ? (
        <div className="flex flex-col gap-2">
          {visible.map((perfume) => (
            <PerfumeRow key={perfume.slug} perfume={perfume} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-base mb-1">No perfumes found</p>
          <p className="text-muted-dark text-sm">Try a different search, or snap a photo in the app.</p>
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full mt-4 py-3 rounded-xl border border-border bg-surface text-sm text-muted hover:text-foreground hover:border-primary/40 transition-all"
        >
          Show more ({filtered.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
