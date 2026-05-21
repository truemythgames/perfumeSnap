import * as WebBrowser from 'expo-web-browser';
export type ListingPerfume = {
  name: string;
  brand: string;
  estimatedPrice?: string;
  retailer?: string;
  imageUrl?: string | null;
  productUrl?: string | null;
  condition?: string | null;
};

export function unwrapListingUrl(url: string): string {
  try {
    let current = url.trim();
    for (let depth = 0; depth < 4; depth += 1) {
      const parsed = new URL(current);
      const host = parsed.hostname.toLowerCase();
      if (
        host.includes('google.')
        || host.includes('googleadservices.')
        || host.includes('doubleclick.')
      ) {
        const next =
          parsed.searchParams.get('q')
          || parsed.searchParams.get('url')
          || parsed.searchParams.get('adurl')
          || parsed.searchParams.get('u');
        if (next && /^https?:\/\//i.test(next)) {
          current = decodeURIComponent(next);
          continue;
        }
      }
      break;
    }
    return current;
  } catch {
    return url;
  }
}

export function isGoogleListingUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().includes('google.');
  } catch {
    return false;
  }
}

export function isSearchListingUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const qs = u.search.toLowerCase();
    if (path.includes('/search')) return true;
    if (path.includes('/sch/')) return true;
    if (qs.includes('_nkw=') || qs.includes('keyword=') || qs.includes('searchterm=') || qs.includes('k=')) return true;
    if (u.hostname.includes('amazon.') && (path === '/s' || path.startsWith('/s?'))) return true;
    if (u.hostname.includes('walmart.') && path.startsWith('/search')) return true;
    if (u.hostname.includes('ebay.') && path.includes('/sch/')) return true;
    return false;
  } catch {
    return true;
  }
}

export function isDirectProductUrl(url?: string | null): boolean {
  if (!url) return false;
  const normalized = unwrapListingUrl(url);
  if (isGoogleListingUrl(normalized) || isSearchListingUrl(normalized)) return false;

  try {
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    if (host.includes('amazon.')) return /\/dp\/|\/gp\/product\//.test(path);
    if (host.includes('ebay.')) return /\/itm\//.test(path) || /\/p\/\d+/.test(path);
    if (host.includes('walmart.')) return /\/ip\//.test(path);
    if (host.includes('sephora.')) return /\/product\//.test(path) || /\/p\//.test(path);
    if (host.includes('ulta.')) return /\/product\//.test(path) || /\/p\//.test(path);
    if (host.includes('fragrancenet.')) return /\/products\//.test(path) || /\/fragrances\//.test(path) || /\/ni\//.test(path);
    if (host.includes('fragrancex.')) return /\/products\//.test(path);
    if (host.includes('nordstrom.')) return /\/s\/[^/]+\/\d+/.test(path);
    if (host.includes('macys.')) return /\/shop\/product\//.test(path);
    if (host.includes('target.')) return /\/p\/|\/-\/a-\d+/i.test(path + u.search);
    if (host.includes('notino.') || host.includes('douglas.')) return path.length > 1 && !path.includes('/search');
    if (host.includes('bedbathandbeyond') || host.includes('buybuybaby')) return /\/product\//.test(path);

    if (path.includes('/search') || path === '/s' || path === '/shop' || path.endsWith('/category')) return false;
    if (/\/(\d{5,}|[a-f0-9-]{8,})(?:\/|$|\?)/i.test(path)) return true;
    if (/\/(?:product|products|p|item|items|dp|ip|fragrance|perfumes|perfume|shop|buy|sku|listing)\/[^/?#]{3,}/i.test(path)) return true;
    const blocked = new Set([
      'search', 'category', 'categories', 'collections', 'collection',
      'shop', 'catalog', 'blog', 'pages', 'cart', 'account', 'login', 'register',
    ]);
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const first = segments[0].toLowerCase();
      const last = segments[segments.length - 1].toLowerCase();
      if (blocked.has(first) || blocked.has(last)) return false;
      if (last.length >= 3) return true;
    }
    if (segments.length === 1) {
      const seg = segments[0].toLowerCase();
      if (blocked.has(seg) || seg.length < 4) return false;
      if (/\.html?$/.test(seg) || seg.includes('-')) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function filterValidSimilarListings<T extends ListingPerfume>(rows: T[]): T[] {
  return rows
    .filter((row) => {
      const raw = row.productUrl?.trim();
      if (!raw) return false;
      return isDirectProductUrl(unwrapListingUrl(raw));
    })
    .map((row) => ({
      ...row,
      productUrl: row.productUrl ? unwrapListingUrl(row.productUrl) : null,
    }));
}

export function hasValidSimilarListings(rows: ListingPerfume[] | undefined | null): boolean {
  return filterValidSimilarListings(rows ?? []).length > 0;
}

/** Returns a direct retailer product URL, or null if only a search page is available. */
export function resolveListingUrl(perfume: ListingPerfume): string | null {
  const raw = perfume.productUrl?.trim();
  if (!raw) return null;
  const url = unwrapListingUrl(raw);
  if (!isDirectProductUrl(url)) return null;
  return url;
}

export async function openSimilarListing(perfume: ListingPerfume): Promise<boolean> {
  const url = resolveListingUrl(perfume);
  if (!url) return false;

  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
  return true;
}
