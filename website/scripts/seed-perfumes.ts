/**
 * Seed script — generates perfume JSON files by calling the /lookup endpoint.
 *
 * Usage:
 *   npx tsx scripts/seed-perfumes.ts
 *
 * Requires the backend server to be running. Set API_URL env var if not localhost:8787.
 */

const API_URL = process.env.API_URL ?? "http://localhost:8787";

const PERFUMES_TO_SEED: { name: string; brand: string }[] = [
  { name: "Sauvage", brand: "Dior" },
  { name: "Bleu de Chanel", brand: "Chanel" },
  { name: "Aventus", brand: "Creed" },
  { name: "La Vie Est Belle", brand: "Lancôme" },
  { name: "Black Orchid", brand: "Tom Ford" },
  { name: "Light Blue", brand: "Dolce & Gabbana" },
  { name: "Acqua di Gio", brand: "Giorgio Armani" },
  { name: "Good Girl", brand: "Carolina Herrera" },
  { name: "Coco Mademoiselle", brand: "Chanel" },
  { name: "The One", brand: "Dolce & Gabbana" },
  { name: "Y Eau de Parfum", brand: "Yves Saint Laurent" },
  { name: "Eros", brand: "Versace" },
  { name: "Born in Roma", brand: "Valentino" },
  { name: "Libre", brand: "Yves Saint Laurent" },
  { name: "Ombré Leather", brand: "Tom Ford" },
  { name: "Tobacco Vanille", brand: "Tom Ford" },
  { name: "Miss Dior", brand: "Dior" },
  { name: "1 Million", brand: "Paco Rabanne" },
  { name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian" },
  { name: "Le Male", brand: "Jean Paul Gaultier" },
  { name: "Chance Eau Tendre", brand: "Chanel" },
  { name: "Invictus", brand: "Paco Rabanne" },
  { name: "J'adore", brand: "Dior" },
  { name: "Flowerbomb", brand: "Viktor & Rolf" },
  { name: "Phantom", brand: "Paco Rabanne" },
  { name: "Club de Nuit Intense Man", brand: "Armaf" },
  { name: "Dylan Blue", brand: "Versace" },
  { name: "Terre d'Hermès", brand: "Hermès" },
  { name: "CK One", brand: "Calvin Klein" },
  { name: "Stronger With You", brand: "Emporio Armani" },
  { name: "Explorer", brand: "Montblanc" },
  { name: "Santal 33", brand: "Le Labo" },
  { name: "Byredo Gypsy Water", brand: "Byredo" },
  { name: "Dior Homme Intense", brand: "Dior" },
  { name: "Angel", brand: "Mugler" },
  { name: "Alien", brand: "Mugler" },
  { name: "Narciso Rodriguez for Her", brand: "Narciso Rodriguez" },
  { name: "Si", brand: "Giorgio Armani" },
  { name: "Versace Pour Homme", brand: "Versace" },
  { name: "L'Homme", brand: "Yves Saint Laurent" },
  { name: "Brit", brand: "Burberry" },
  { name: "Her", brand: "Burberry" },
  { name: "Wood Sage & Sea Salt", brand: "Jo Malone" },
  { name: "Peony & Blush Suede", brand: "Jo Malone" },
  { name: "Another 13", brand: "Le Labo" },
  { name: "Mojave Ghost", brand: "Byredo" },
  { name: "Noir Extreme", brand: "Tom Ford" },
  { name: "Lost Cherry", brand: "Tom Ford" },
  { name: "Spicebomb Extreme", brand: "Viktor & Rolf" },
  { name: "Gentleman", brand: "Givenchy" },
  { name: "L'Interdit", brand: "Givenchy" },
  { name: "Nuit d'Issey", brand: "Issey Miyake" },
  { name: "L'Eau d'Issey", brand: "Issey Miyake" },
  { name: "Scandal", brand: "Jean Paul Gaultier" },
  { name: "BOSS Bottled", brand: "Hugo Boss" },
  { name: "The Scent", brand: "Hugo Boss" },
  { name: "Azzaro Wanted", brand: "Azzaro" },
  { name: "Cool Water", brand: "Davidoff" },
  { name: "Molecule 01", brand: "Escentric Molecules" },
  { name: "Rose 31", brand: "Le Labo" },
  { name: "Oud Wood", brand: "Tom Ford" },
  { name: "Tuscan Leather", brand: "Tom Ford" },
  { name: "Portrait of a Lady", brand: "Frédéric Malle" },
  { name: "Infrared", brand: "Prada" },
  { name: "Luna Rossa Carbon", brand: "Prada" },
  { name: "L'Homme Prada", brand: "Prada" },
  { name: "My Way", brand: "Giorgio Armani" },
  { name: "Code Absolu", brand: "Giorgio Armani" },
  { name: "Allure Homme Sport", brand: "Chanel" },
  { name: "No. 5", brand: "Chanel" },
  { name: "Gucci Guilty", brand: "Gucci" },
  { name: "Gucci Bloom", brand: "Gucci" },
  { name: "The Most Wanted", brand: "Azzaro" },
  { name: "Bad Boy", brand: "Carolina Herrera" },
  { name: "212 VIP", brand: "Carolina Herrera" },
  { name: "Layton", brand: "Parfums de Marly" },
  { name: "Pegasus", brand: "Parfums de Marly" },
  { name: "Sedley", brand: "Parfums de Marly" },
  { name: "Herod", brand: "Parfums de Marly" },
  { name: "Rehab", brand: "Initio" },
  { name: "Side Effect", brand: "Initio" },
  { name: "Interlude Man", brand: "Amouage" },
  { name: "Reflection Man", brand: "Amouage" },
  { name: "Naxos", brand: "Xerjoff" },
  { name: "Erba Pura", brand: "Xerjoff" },
  { name: "Aventure", brand: "Al Haramain" },
  { name: "BR540 Extrait", brand: "Maison Francis Kurkdjian" },
  { name: "Gentle Fluidity Silver", brand: "Maison Francis Kurkdjian" },
  { name: "Grand Soir", brand: "Maison Francis Kurkdjian" },
  { name: "Noir de Noir", brand: "Tom Ford" },
  { name: "Bitter Peach", brand: "Tom Ford" },
  { name: "Bergamote 22", brand: "Le Labo" },
  { name: "Neroli 36", brand: "Le Labo" },
  { name: "Black Opium", brand: "Yves Saint Laurent" },
  { name: "Mon Paris", brand: "Yves Saint Laurent" },
  { name: "Joy", brand: "Dior" },
  { name: "Sauvage Elixir", brand: "Dior" },
  { name: "Fahrenheit", brand: "Dior" },
  { name: "Poison Girl", brand: "Dior" },
  { name: "Very Good Girl", brand: "Carolina Herrera" },
  { name: "Toy Boy", brand: "Moschino" },
  { name: "Halloween Man X", brand: "Jesus del Pozo" },
  { name: "Cedrat Boisé", brand: "Mancera" },
  { name: "Instant Crush", brand: "Mancera" },
  { name: "Red Tobacco", brand: "Mancera" },
  { name: "Roses Vanille", brand: "Mancera" },
  { name: "Percival", brand: "Parfums de Marly" },
  { name: "Carlisle", brand: "Parfums de Marly" },
  { name: "Greenley", brand: "Parfums de Marly" },
  { name: "Musk Therapy", brand: "Initio" },
  { name: "Oud for Greatness", brand: "Initio" },
  { name: "Atomic Rose", brand: "Initio" },
  { name: "Hacivat", brand: "Nishane" },
  { name: "Ani", brand: "Nishane" },
  { name: "Fan Your Flames", brand: "Nishane" },
  { name: "Hundred Silent Ways", brand: "Nishane" },
  { name: "Alexandria II", brand: "Xerjoff" },
  { name: "Nio", brand: "Xerjoff" },
  { name: "1861 Renaissance", brand: "Xerjoff" },
  { name: "40 Knots", brand: "Xerjoff" },
  { name: "Aventus Cologne", brand: "Creed" },
  { name: "Green Irish Tweed", brand: "Creed" },
  { name: "Silver Mountain Water", brand: "Creed" },
  { name: "Viking", brand: "Creed" },
  { name: "Millesime Imperial", brand: "Creed" },
  { name: "Royal Oud", brand: "Creed" },
  { name: "Love Don't Be Shy", brand: "Kilian" },
  { name: "Angels' Share", brand: "Kilian" },
  { name: "Apple Brandy on the Rocks", brand: "Kilian" },
  { name: "Good Girl Gone Bad", brand: "Kilian" },
  { name: "Black Phantom", brand: "Kilian" },
  { name: "Straight to Heaven", brand: "Kilian" },
  { name: "Jazz Club", brand: "Maison Margiela" },
  { name: "By the Fireplace", brand: "Maison Margiela" },
  { name: "Sailing Day", brand: "Maison Margiela" },
  { name: "Whispers in the Library", brand: "Maison Margiela" },
  { name: "Beach Walk", brand: "Maison Margiela" },
  { name: "Replica Bubble Bath", brand: "Maison Margiela" },
  { name: "Aventus for Her", brand: "Creed" },
  { name: "Delina", brand: "Parfums de Marly" },
  { name: "Delina Exclusif", brand: "Parfums de Marly" },
  { name: "Cassili", brand: "Parfums de Marly" },
  { name: "Meliora", brand: "Parfums de Marly" },
  { name: "Safanad", brand: "Parfums de Marly" },
  { name: "Mon Guerlain", brand: "Guerlain" },
  { name: "Shalimar", brand: "Guerlain" },
  { name: "L'Homme Ideal", brand: "Guerlain" },
  { name: "Vetiver", brand: "Guerlain" },
  { name: "Habit Rouge", brand: "Guerlain" },
  { name: "Bleu Electrique", brand: "La Maison Cifonelli" },
  { name: "Amber Aoud", brand: "Roja Dove" },
  { name: "Elysium", brand: "Roja Dove" },
  { name: "Enigma", brand: "Roja Dove" },
  { name: "PDM Godolphin", brand: "Parfums de Marly" },
  { name: "Oriana", brand: "Parfums de Marly" },
  { name: "Khamrah", brand: "Lattafa" },
  { name: "Raghba", brand: "Lattafa" },
  { name: "Yara", brand: "Lattafa" },
  { name: "Asad", brand: "Lattafa" },
  { name: "Amber Oud Gold Edition", brand: "Al Haramain" },
  { name: "L'Aventure", brand: "Al Haramain" },
  { name: "Amber Oud Rouge", brand: "Al Haramain" },
  { name: "Detour Noir", brand: "Al Haramain" },
  { name: "Club de Nuit Intense Woman", brand: "Armaf" },
  { name: "Club de Nuit Milestone", brand: "Armaf" },
  { name: "Sillage", brand: "Armaf" },
  { name: "Tres Nuit", brand: "Armaf" },
  { name: "Ultra Male", brand: "Jean Paul Gaultier" },
  { name: "Le Beau Le Parfum", brand: "Jean Paul Gaultier" },
  { name: "Scandal Pour Homme", brand: "Jean Paul Gaultier" },
  { name: "Burberry Touch", brand: "Burberry" },
  { name: "Mr. Burberry", brand: "Burberry" },
  { name: "Weekend", brand: "Burberry" },
  { name: "Aqva Pour Homme", brand: "Bvlgari" },
  { name: "Man in Black", brand: "Bvlgari" },
  { name: "Omnia Crystalline", brand: "Bvlgari" },
  { name: "Goldea The Roman Night", brand: "Bvlgari" },
  { name: "Dolce", brand: "Dolce & Gabbana" },
  { name: "The One EDP", brand: "Dolce & Gabbana" },
  { name: "K by Dolce & Gabbana", brand: "Dolce & Gabbana" },
  { name: "Pour Femme", brand: "Dolce & Gabbana" },
  { name: "L'Imperatrice", brand: "Dolce & Gabbana" },
  { name: "Prada Candy", brand: "Prada" },
  { name: "Paradoxe", brand: "Prada" },
  { name: "Eternity", brand: "Calvin Klein" },
  { name: "Obsession", brand: "Calvin Klein" },
  { name: "Euphoria", brand: "Calvin Klein" },
  { name: "CK Everyone", brand: "Calvin Klein" },
  { name: "Pure XS", brand: "Paco Rabanne" },
  { name: "Olympéa", brand: "Paco Rabanne" },
  { name: "Fame", brand: "Paco Rabanne" },
  { name: "Lady Million", brand: "Paco Rabanne" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function lookupPerfume(name: string, brand: string) {
  const res = await fetch(`${API_URL}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, brand }),
  });
  if (!res.ok) throw new Error(`Lookup failed for ${name}: ${res.statusText}`);
  return res.json();
}

async function fetchImage(slug: string, query: string, imgDir: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${API_URL}/scrape-image?q=${encodeURIComponent(query + " perfume bottle")}`);
    if (!res.ok) return undefined;
    const { imageUrl } = await res.json();
    if (!imageUrl) return undefined;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return undefined;

    const contentType = imgRes.headers.get("content-type") ?? "";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const fileName = `${slug}.${ext}`;
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const fs = await import("fs");
    const path = await import("path");
    fs.writeFileSync(path.join(imgDir, fileName), buffer);

    return `/perfumes/${fileName}`;
  } catch {
    return undefined;
  }
}

async function main() {
  const fs = await import("fs");
  const path = await import("path");
  const outDir = path.join(__dirname, "../src/content/perfumes");
  const imgDir = path.join(__dirname, "../public/perfumes");

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  console.log(`Seeding ${PERFUMES_TO_SEED.length} perfumes from ${API_URL}...\n`);

  let success = 0;
  let failed = 0;

  for (const { name, brand } of PERFUMES_TO_SEED) {
    const slug = slugify(`${brand}-${name}`);
    const filePath = path.join(outDir, `${slug}.json`);

    if (fs.existsSync(filePath)) {
      console.log(`  SKIP  ${brand} - ${name} (already exists)`);
      success++;
      continue;
    }

    try {
      console.log(`  FETCH ${brand} - ${name}...`);
      const [data, image] = await Promise.all([
        lookupPerfume(name, brand),
        fetchImage(slug, `${brand} ${name}`, imgDir),
      ]);

      const perfumeData = {
        name: data.name ?? name,
        brand: data.brand ?? brand,
        slug,
        description: data.description ?? "",
        fragranceFamily: data.fragranceFamily ?? data.fragrance_family ?? "Unknown",
        concentration: data.concentration ?? "Eau de Parfum",
        topNotes: data.topNotes ?? data.top_notes ?? [],
        middleNotes: data.middleNotes ?? data.middle_notes ?? [],
        baseNotes: data.baseNotes ?? data.base_notes ?? [],
        longevity: data.longevity ?? "Moderate",
        sillage: data.sillage ?? "Moderate",
        occasions: data.occasions ?? [],
        seasons: data.seasons ?? [],
        priceRange: data.priceRange ?? data.price_range ?? "",
        gender: data.gender ?? "Unisex",
        ...(image && { image }),
      };

      fs.writeFileSync(filePath, JSON.stringify(perfumeData, null, 2));
      console.log(`  OK    ${brand} - ${name}`);
      success++;

      // Rate limit: wait 1s between requests
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  FAIL  ${brand} - ${name}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
}

main().catch(console.error);
