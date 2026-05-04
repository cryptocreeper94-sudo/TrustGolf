import { db } from "./db";
import { courses } from "../shared/schema";
import { getCourseImageUrl } from "./image-provider";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

interface OverpassNode {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL });

export async function scanRegionForCourses(state: string, city: string): Promise<{ added: number; skipped: number }> {
  console.log(`[course-scanner] Beginning OSM query for ${city}, ${state}...`);

  // Target: leisure=golf_course nodes/areas within the bounding area of the state/city
  const overpassQuery = `
    [out:json][timeout:25];
    area["name"="${state}"]["admin_level"="4"]->.searchState;
    area["name"="${city}"]["admin_level"="8"]->.searchCity;
    (
      nwr["leisure"="golf_course"](area.searchCity)(area.searchState);
    );
    out center;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    if (!res.ok) {
      throw new Error(`Overpass API Error: ${res.statusText}`);
    }

    const data: OverpassResponse = await res.json();
    let added = 0;
    let skipped = 0;

    for (const element of data.elements) {
      const name = element.tags?.name || element.tags?.['name:en'];
      if (!name) {
        skipped++;
        continue;
      }

      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      const website = element.tags?.website || null;
      const phone = element.tags?.phone || null;

      if (!lat || !lon) {
        skipped++;
        continue;
      }

      // Built-in deduplication: Check if Course + City already exists
      const existing = await db
        .select()
        .from(courses)
        .where(and(eq(courses.name, name), eq(courses.city, city)))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      let isPublic = true;
      let enrichedAmenities = "Clubhouse, Putting Green";
      let enrichedBookingUrl = website;
      let enrichedDescription = "A local golf course offering scenic views and challenging play.";

      // Fallback heuristics
      if (name.toLowerCase().includes("country club") || name.toLowerCase().includes("private")) {
        isPublic = false;
        enrichedAmenities = "Private Clubhouse, Practice Facility, Dining, Pro Shop";
      }

      // Add a small delay for AI to not get rate limited if we need to ping it for every missing website
      try {
        if (!website) {
          const aiContext = await generateEnrichmentContext(name, city, state);
          if (aiContext) {
            enrichedDescription = aiContext.description || enrichedDescription;
            isPublic = aiContext.isPublic ?? isPublic;
          }
        }
      } catch (aiErr) {
        console.warn(`[course-scanner] AI Enrichment failed for ${name}, proceeding with raw data fallback.`);
      }

      // Fetch dynamic premium image fallback deterministically
      const generatedImageUrl = await getCourseImageUrl(`${name}-${city}-${state}`);

      // Insert into database
      await db.insert(courses).values({
        name,
        location: `${lat},${lon}`, 
        city,
        state,
        latitude: lat,
        longitude: lon,
        holes: element.tags?.holes ? parseInt(element.tags.holes) : 18,
        description: enrichedDescription,
        website: website,
        phone,
        imageUrl: generatedImageUrl,
        bookingUrl: enrichedBookingUrl,
        isPublic,
        amenities: enrichedAmenities,
        par: 72,
        rating: 4.0,
        slope: 113,
        yardage: 6500,
        placeId: `osm-${element.type}-${element.id}`,
        lastSyncedAt: new Date(),
      });
      
      added++;
    }

    console.log(`[course-scanner] Scan Complete. Added: ${added}, Skipped Duplicates/Invalid: ${skipped}`);
    return { added, skipped };

  } catch (error) {
    console.error("[course-scanner] Fatal error scanning region:", error);
    return { added: 0, skipped: 0 };
  }
}

async function generateEnrichmentContext(courseName: string, city: string, state: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a golf database expert. Based on the name and location of this golf course, output its likely classification. Return a JSON object with 'description' (a brief 1-sentence alluring summary) and 'isPublic' (boolean). If you don't know the course exactly, infer based on the name (e.g. 'Country Club' is private)."
        },
        {
          role: "user",
          content: `${courseName} in ${city}, ${state}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed as { description?: string; isPublic?: boolean };
  } catch (e) {
    return null;
  }
}
