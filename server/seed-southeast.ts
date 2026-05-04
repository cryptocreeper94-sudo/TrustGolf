import { scanRegionForCourses } from "./course-scanner";

async function runSeed() {
  console.log("Starting Manual Southeast Course Injection...");
  
  const regions = [
    { state: "South Carolina", city: "Charleston" },
    { state: "South Carolina", city: "Myrtle Beach" },
    { state: "Georgia", city: "Atlanta" },
    { state: "Georgia", city: "Augusta" },
    { state: "Tennessee", city: "Nashville" },
    { state: "Alabama", city: "Birmingham" },
    { state: "Arkansas", city: "Little Rock" },
    { state: "North Carolina", city: "Pinehurst" }
  ];

  for (const region of regions) {
    try {
      console.log(`\n--- Scanning ${region.city}, ${region.state} ---`);
      const { added, skipped } = await scanRegionForCourses(region.state, region.city);
      console.log(`Finished ${region.city}: Added ${added}, Skipped ${skipped}`);
      
      // Delay to avoid hitting Overpass API rate limits (too many requests)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (e) {
      console.error(`Failed to scan ${region.city}`, e);
    }
  }
  
  console.log("Seed injection completed.");
}

runSeed().catch(console.error).finally(() => process.exit(0));
