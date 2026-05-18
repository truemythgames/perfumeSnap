import type { ApiArticle } from '../services/api';

export type PerfumeArticle = ApiArticle;

export const FALLBACK_ARTICLES: PerfumeArticle[] = [
  {
    id: '1',
    slug: 'fragrance-families-explained',
    title: 'Fragrance Families Explained',
    subtitle: 'Floral, Oriental, Woody & Fresh',
    description: 'Discover the four main fragrance families.',
    tags: ['Basics'],
    icon: 'flower-outline',
    color: '#c8943c',
    readingTime: 4,
    imageUrl: null,
    sections: [
      { type: 'heading', text: 'What Are Fragrance Families?' },
      { type: 'paragraph', text: 'Every perfume belongs to a fragrance family — a classification system that groups scents by their dominant characteristics. Understanding these families is the single most useful shortcut to finding perfumes you\'ll love.' },
      { type: 'heading', text: 'The Four Families' },
      { type: 'paragraph', text: 'Floral scents focus on flowers like rose, jasmine, or orange blossom. Woody scents use sandalwood, cedar, and vetiver. Fresh perfumes are citrus, green, or aquatic. Oriental perfumes are warmer, richer, and often sweeter.' },
      { type: 'paragraph', text: 'When you know your preferred family, picking perfumes you\'ll actually wear becomes much easier.' },
    ],
  },
  {
    id: '2',
    slug: 'understanding-perfume-notes',
    title: 'Understanding Perfume Notes',
    subtitle: 'Top, heart & base notes decoded',
    description: 'Learn how perfumes evolve over time.',
    tags: ['Basics'],
    icon: 'musical-notes-outline',
    color: '#b87a3a',
    readingTime: 4,
    imageUrl: null,
    sections: [
      { type: 'heading', text: 'The Fragrance Pyramid' },
      { type: 'paragraph', text: 'Perfumes evolve in stages: top, heart, and base notes. Top notes are what you smell first — bright and quick to fade. Heart notes are the core character. Base notes anchor the scent for hours.' },
      { type: 'paragraph', text: 'Always test a perfume for at least 30–60 minutes to experience its full structure.' },
    ],
  },
  {
    id: '3',
    slug: 'how-to-apply-perfume',
    title: 'How to Apply Perfume',
    subtitle: 'Pulse points & lasting tips',
    description: 'Apply perfume the right way for maximum longevity.',
    tags: ['Tips'],
    icon: 'water-outline',
    color: '#d4a44a',
    readingTime: 3,
    imageUrl: null,
    sections: [
      { type: 'heading', text: 'Pulse Point Strategy' },
      { type: 'paragraph', text: 'Apply to pulse points: neck, wrists, inner elbows. Spray on moisturized skin for better longevity. Avoid rubbing wrists together — it crushes top notes.' },
      { type: 'paragraph', text: 'Two to four sprays is usually enough for most Eau de Parfum formulas.' },
    ],
  },
  {
    id: '4',
    slug: 'edt-vs-edp-explained',
    title: 'EDT vs EDP: Which to Choose?',
    subtitle: 'Concentration & longevity guide',
    description: 'Understanding perfume concentrations.',
    tags: ['Guide'],
    icon: 'flask-outline',
    color: '#a07230',
    readingTime: 4,
    imageUrl: null,
    sections: [
      { type: 'heading', text: 'Concentration Matters' },
      { type: 'paragraph', text: 'EDT is usually lighter and fresher. EDP is richer and lasts longer. Cologne has lower concentration for light wear. The same fragrance in EDT and EDP can smell quite different.' },
    ],
  },
  {
    id: '5',
    slug: 'storing-your-fragrances',
    title: 'How to Store Perfume',
    subtitle: 'Keep your scents fresh for years',
    description: 'Proper storage keeps perfume fresh for years.',
    tags: ['Tips'],
    icon: 'cube-outline',
    color: '#c4884a',
    readingTime: 3,
    imageUrl: null,
    sections: [
      { type: 'heading', text: 'Fragrance Has Enemies' },
      { type: 'paragraph', text: 'Store perfumes away from heat, light, and humidity. A cool, dark drawer or cabinet is ideal. Keep bottles tightly closed to prevent oxidation.' },
    ],
  },
];

export function getArticleById(articles: PerfumeArticle[], id: string) {
  return articles.find((a) => a.id === id) || null;
}
