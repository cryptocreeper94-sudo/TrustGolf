import crypto from "crypto";

/**
 * Curated array of Ultra-Premium, 4K landscape golf photos from Unsplash.
 * These are strictly guaranteed to elevate the Coffee Table Book UI aesthetics.
 * 
 * NOTE: When budget allows, this entire file can be replaced with:
 * `fetch(https://maps.googleapis.com/maps/api/place/photo?photoreference=...)`
 */
const SPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1535136113824-001007a1ce24?auto=format&fit=crop&q=80&w=1080", // Sunrise teebox
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&q=80&w=1080", // Lush green fairway
  "https://images.unsplash.com/photo-1622340578168-5a1e2aba9e6f?auto=format&fit=crop&q=80&w=1080", // Coastal hole
  "https://images.unsplash.com/photo-1593111774640-36a1f5bfedfa?auto=format&fit=crop&q=80&w=1080", // Ball and view
  "https://images.unsplash.com/photo-1592393351382-b7eec9de6aa0?auto=format&fit=crop&q=80&w=1080", // Desert golf
  "https://images.unsplash.com/photo-1611093556041-e940b2b80456?auto=format&fit=crop&q=80&w=1080", // Wide mountainous links
  "https://images.unsplash.com/photo-1580130601254-05fa235abeab?auto=format&fit=crop&q=80&w=1080", // Aerial view
  "https://images.unsplash.com/photo-1590487315174-8db6d9bf7cfd?auto=format&fit=crop&q=80&w=1080", // Fairway shadow
  "https://images.unsplash.com/photo-1508253730651-e5ace80a7025?auto=format&fit=crop&q=80&w=1080", // Golf cart scenic
  "https://images.unsplash.com/photo-1490226317208-8e6ca6f457cc?auto=format&fit=crop&q=80&w=1080", // Classic tee box
  "https://images.unsplash.com/photo-1678198904791-0fcf05a81ca0?auto=format&fit=crop&q=80&w=1080", // Autumn luxury course
  "https://images.unsplash.com/photo-1481005234127-147820abaf1b?auto=format&fit=crop&q=80&w=1080", // Sunset twilight
];

/**
 * Given a unique string (like Course Name + City), deterministically select
 * a gorgeous landscape image from our curated 100% Free array. 
 * This ensures the exact same course always loads the exact same image forever,
 * giving the illusion of a hand-mapped database.
 * 
 * @param uniqueIdentifier The string used to hash a unique image index
 * @returns An Ultra-Premium image URL
 */
export async function getCourseImageUrl(uniqueIdentifier: string): Promise<string> {
  // Hash the unique string into an integer deterministically
  const hash = crypto.createHash("md5").update(uniqueIdentifier).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  
  // Pick the specific image index
  const idx = num % SPLASH_FALLBACKS.length;
  return SPLASH_FALLBACKS[idx];
}
