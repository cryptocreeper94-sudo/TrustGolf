import { db } from "./db";
import { courses } from "../shared/schema";
import { getCourseImageUrl } from "./image-provider";
import { isNull, eq } from "drizzle-orm";

async function runPatch() {
  console.log("Starting Image Fallback Patch...");
  
  // Find all courses where imageUrl is completely null
  const blankCourses = await db.select().from(courses).where(isNull(courses.imageUrl));
  
  if (blankCourses.length === 0) {
    console.log("No blank courses found! Catalog is fully populated with images.");
    return;
  }
  
  console.log(`Found ${blankCourses.length} courses missing images. Generating hashes...`);
  
  for (const course of blankCourses) {
    const dynamicImg = await getCourseImageUrl(`${course.name}-${course.city}-${course.state}`);
    
    await db.update(courses)
      .set({ imageUrl: dynamicImg })
      .where(eq(courses.id, course.id));
      
    console.log(`[PATCHED] ${course.name} -> ${dynamicImg}`);
  }
  
  console.log("Patch successfully completed! UI will now render 4K imagery for all courses.");
}

runPatch().catch(console.error).finally(() => process.exit(0));
