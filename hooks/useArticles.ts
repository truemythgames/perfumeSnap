import { useState, useEffect } from 'react';
import { fetchArticles, type ApiArticle } from '../services/api';
import { FALLBACK_ARTICLES } from '../constants/articles';

let cachedArticles: ApiArticle[] | null = null;

export function useArticles() {
  const [articles, setArticles] = useState<ApiArticle[]>(cachedArticles || FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(!cachedArticles);

  useEffect(() => {
    if (cachedArticles) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchArticles();
        if (!cancelled && data.length > 0) {
          cachedArticles = data;
          setArticles(data);
        }
      } catch (err) {
        console.warn('[PerfumeSnap] fetchArticles error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { articles, loading };
}
