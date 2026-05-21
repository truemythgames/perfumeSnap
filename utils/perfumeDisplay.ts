const CONCENTRATION_SUFFIX =
  /\s+(eau de parfum|eau de toilette|eau de cologne|extrait de parfum|extrait|parfum|cologne|\bedp\b|\bedt\b|\bedc\b)(?:\s|$).*$/i;

const BOTTLE_DESCRIPTION = /\s+in\s+.+$/i;
const PACKAGING_NOISE = /\s+(bottle|packaging|box|matte|glossy|spray|refill|refillable)\b.*$/i;

/** Strip brand prefix, concentration, and bottle fluff from AI name fields. */
export function cleanFragranceName(name: string, brand: string): string {
  let cleaned = (name || '').trim();
  const brandTrimmed = (brand || '').trim();

  if (brandTrimmed && cleaned.toLowerCase().startsWith(brandTrimmed.toLowerCase())) {
    cleaned = cleaned.slice(brandTrimmed.length).trim();
  }

  cleaned = cleaned.replace(BOTTLE_DESCRIPTION, '').trim();
  cleaned = cleaned.replace(CONCENTRATION_SUFFIX, '').trim();
  cleaned = cleaned.replace(PACKAGING_NOISE, '').trim();
  cleaned = cleaned.replace(/^[-–—:,]+|[-–—:,]+$/g, '').trim();

  return cleaned || (name || '').trim();
}

/** Title shown in result screens: "Brand Fragrance Name". */
export function formatPerfumeTitle(name: string, brand: string): string {
  const fragrance = cleanFragranceName(name, brand);
  const brandTrimmed = (brand || '').trim();
  if (!brandTrimmed) return fragrance;
  if (!fragrance) return brandTrimmed;
  if (fragrance.toLowerCase() === brandTrimmed.toLowerCase()) return brandTrimmed;
  return `${brandTrimmed} ${fragrance}`;
}
