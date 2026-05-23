import { SITE_URL, SITE_NAME } from "./seo";
import { APP_STORE_URL, PLAY_STORE_URL } from "./storeLinks";

export function appJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    description:
      "Identify any perfume instantly with AI. Snap a photo, get the full fragrance profile, notes breakdown, and price comparison.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: SITE_URL,
    downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
    image: `${SITE_URL}/og-default.png`,
  };
}

export function breadcrumbJsonLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

export interface PerfumeData {
  name: string;
  brand: string;
  slug: string;
  description: string;
  fragranceFamily: string;
  concentration: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  sillage: string;
  occasions: string[];
  seasons: string[];
  priceRange: string;
  gender: string;
  image?: string;
}

export function perfumeJsonLd(perfume: PerfumeData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${perfume.name} by ${perfume.brand}`,
    brand: { "@type": "Brand", name: perfume.brand },
    description: perfume.description,
    category: perfume.fragranceFamily,
    url: `${SITE_URL}/perfumes/${perfume.slug}`,
    ...(perfume.image && { image: `${SITE_URL}${perfume.image}` }),
    additionalProperty: [
      { "@type": "PropertyValue", name: "Concentration", value: perfume.concentration },
      { "@type": "PropertyValue", name: "Top Notes", value: perfume.topNotes.join(", ") },
      { "@type": "PropertyValue", name: "Middle Notes", value: perfume.middleNotes.join(", ") },
      { "@type": "PropertyValue", name: "Base Notes", value: perfume.baseNotes.join(", ") },
      { "@type": "PropertyValue", name: "Longevity", value: perfume.longevity },
      { "@type": "PropertyValue", name: "Sillage", value: perfume.sillage },
      { "@type": "PropertyValue", name: "Occasions", value: perfume.occasions.join(", ") },
      { "@type": "PropertyValue", name: "Seasons", value: perfume.seasons.join(", ") },
    ],
  };
}

export function articleJsonLd(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
