import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.createUser({ username, password });
    } else if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    res.json({ id: user.id, username: user.username, displayName: user.displayName, handicap: user.handicap });
  });

  app.get("/api/courses", async (_req: Request, res: Response) => {
    const allCourses = await storage.getCourses();
    res.json(allCourses);
  });

  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    const course = await storage.createCourse(req.body);
    res.status(201).json(course);
  });

  app.get("/api/rounds/:userId", async (req: Request, res: Response) => {
    const userRounds = await storage.getRounds(req.params.userId);
    res.json(userRounds);
  });

  app.post("/api/rounds", async (req: Request, res: Response) => {
    const round = await storage.createRound(req.body);
    res.status(201).json(round);
  });

  app.get("/api/deals", async (_req: Request, res: Response) => {
    const allDeals = await storage.getDeals();
    res.json(allDeals);
  });

  app.post("/api/deals", async (req: Request, res: Response) => {
    const deal = await storage.createDeal(req.body);
    res.status(201).json(deal);
  });

  app.get("/api/swing-analyses/:userId", async (req: Request, res: Response) => {
    const analyses = await storage.getSwingAnalyses(req.params.userId);
    res.json(analyses);
  });

  app.post("/api/swing-analyze", async (req: Request, res: Response) => {
    const { userId, imageBase64 } = req.body;
    if (!userId || !imageBase64) return res.status(400).json({ error: "Missing userId or image" });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert golf swing analyst and PGA-certified instructor. Analyze the golf swing image provided and give detailed, actionable feedback. Structure your response as JSON with these fields:
{
  "overallScore": (number 1-100),
  "grip": { "score": (1-10), "feedback": "..." },
  "stance": { "score": (1-10), "feedback": "..." },
  "backswing": { "score": (1-10), "feedback": "..." },
  "downswing": { "score": (1-10), "feedback": "..." },
  "impact": { "score": (1-10), "feedback": "..." },
  "followThrough": { "score": (1-10), "feedback": "..." },
  "tempo": { "score": (1-10), "feedback": "..." },
  "summary": "Brief overall assessment",
  "topTips": ["tip1", "tip2", "tip3"],
  "drills": ["drill1", "drill2"]
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this golf swing and provide detailed feedback:" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let analysisResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, overallScore: 70 };
      } catch {
        analysisResult = { summary: content, overallScore: 70 };
      }

      const analysis = await storage.createSwingAnalysis({
        userId,
        analysisResult,
        overallScore: analysisResult.overallScore || 70,
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Swing analysis error:", error);
      res.status(500).json({ error: "Failed to analyze swing" });
    }
  });

  app.get("/api/stats/:userId", async (req: Request, res: Response) => {
    const userRounds = await storage.getRounds(req.params.userId);
    if (userRounds.length === 0) {
      return res.json({ totalRounds: 0, averageScore: 0, bestScore: 0, recentTrend: [] });
    }
    const scores = userRounds.map(r => r.totalScore);
    const totalRounds = scores.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalRounds);
    const bestScore = Math.min(...scores);
    const recentTrend = userRounds.slice(0, 10).map(r => ({
      date: r.date,
      score: r.totalScore,
      course: r.courseName,
    }));
    res.json({ totalRounds, averageScore, bestScore, recentTrend });
  });

  app.post("/api/seed", async (_req: Request, res: Response) => {
    const existingCourses = await storage.getCourses();
    if (existingCourses.length > 0) {
      return res.json({ message: "Already seeded", courses: existingCourses.length });
    }

    const sampleCourses = [
      {
        name: "Augusta National Golf Club",
        location: "2604 Washington Rd",
        city: "Augusta",
        state: "GA",
        holes: 18,
        par: 72,
        rating: 4.9,
        slope: 148,
        yardage: 7475,
        greenFee: 350,
        courseType: "Private",
        designer: "Alister MacKenzie & Bobby Jones",
        yearBuilt: 1933,
        description: "Home of The Masters Tournament, Augusta National is widely regarded as one of the most beautiful and prestigious golf courses in the world. The immaculately manicured grounds feature blooming azaleas, towering pines, and Rae's Creek winding through the property. Every hole carries legacy — from the daunting Amen Corner (holes 11-13) to the dramatic par-3 12th over Rae's Creek. The course underwent major renovations to keep pace with modern equipment, stretching to 7,475 yards while preserving MacKenzie's strategic design philosophy.",
        amenities: "Pro Shop, Champions Dining Room, Trophy Room, Caddie Service, Practice Range, Par-3 Course, Eisenhower Cabin, Crow's Nest",
        phone: "(706) 667-6000",
        website: "https://www.augustanational.com",
        imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600", "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600", "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600"],
      },
      {
        name: "Pebble Beach Golf Links",
        location: "1700 17-Mile Drive",
        city: "Pebble Beach",
        state: "CA",
        holes: 18,
        par: 72,
        rating: 4.8,
        slope: 145,
        yardage: 6828,
        greenFee: 575,
        courseType: "Resort",
        designer: "Jack Neville & Douglas Grant",
        yearBuilt: 1919,
        description: "Perched on the rugged cliffs of the Monterey Peninsula, Pebble Beach Golf Links offers some of the most breathtaking scenery in all of golf. Eight holes hug the Pacific coastline, delivering dramatic ocean vistas at every turn. The par-3 7th hole — a tiny emerald jewel surrounded by rocks and surf — is one of the most photographed holes in golf. Host of six U.S. Opens and countless PGA Tour events, this bucket-list course combines natural beauty with championship-caliber challenge. The sea otters, harbor seals, and occasional whale sightings make every round unforgettable.",
        amenities: "Pro Shop, The Lodge, Spa, 4 Restaurants, Practice Facility, Caddie Service, The Tap Room, Gallery Café, Stillwater Bar & Grill",
        phone: "(831) 622-8723",
        website: "https://www.pebblebeach.com",
        imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600", "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600", "https://images.unsplash.com/photo-1592919505780-303950717480?w=600"],
      },
      {
        name: "TPC Sawgrass - Stadium Course",
        location: "110 Championship Way",
        city: "Ponte Vedra Beach",
        state: "FL",
        holes: 18,
        par: 72,
        rating: 4.7,
        slope: 155,
        yardage: 7215,
        greenFee: 450,
        courseType: "Resort",
        designer: "Pete Dye",
        yearBuilt: 1980,
        description: "The Stadium Course at TPC Sawgrass is one of the most recognizable courses on earth, home to THE PLAYERS Championship. Pete Dye's genius is on full display — from the mounding that creates natural amphitheaters to the infamous par-3 17th Island Green, where more than 100,000 balls find a watery grave each year. The course demands precision off every tee, with water lurking on nearly every hole and a finishing stretch (16-18) that has decided countless championships. The 2024 renovation modernized the practice facilities while keeping Dye's fearsome layout intact.",
        amenities: "Pro Shop, Clubhouse, Mediterranean-Style Dining, Practice Range, Short Game Area, Caddie Service, Locker Rooms, TPC Network Club",
        phone: "(904) 273-3235",
        website: "https://tpc.com/sawgrass",
        imageUrl: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1600166898405-da9535204843?w=600", "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=600"],
      },
      {
        name: "Pinehurst No. 2",
        location: "80 Carolina Vista",
        city: "Pinehurst",
        state: "NC",
        holes: 18,
        par: 72,
        rating: 4.6,
        slope: 144,
        yardage: 7588,
        greenFee: 395,
        courseType: "Resort",
        designer: "Donald Ross",
        yearBuilt: 1907,
        description: "Donald Ross's masterpiece in the Sandhills of North Carolina is America's St. Andrews. The crowned, turtle-back greens are the course's defining feature — balls that miss the putting surface roll away into collection areas, demanding a world-class short game. Pinehurst No. 2 has hosted more single championships than any course in America, including the historic 2014 back-to-back U.S. Open and U.S. Women's Open. A 2011 restoration by Coore & Crenshaw removed all rough, returning the course to Ross's original sandy waste-area design. The result is a strategic masterpiece that rewards thinking golfers.",
        amenities: "Pro Shop, Resort Hotel, 9 Golf Courses, Spa, Dining Hall, The Deuce Bar, Practice Range, Short Game Complex, Putting Course, Croquet",
        phone: "(910) 235-8507",
        website: "https://www.pinehurst.com",
        imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600", "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600"],
      },
      {
        name: "Bethpage Black",
        location: "99 Quaker Meeting House Rd",
        city: "Farmingdale",
        state: "NY",
        holes: 18,
        par: 71,
        rating: 4.5,
        slope: 152,
        yardage: 7468,
        greenFee: 150,
        courseType: "Public",
        designer: "A.W. Tillinghast",
        yearBuilt: 1936,
        description: "A famously brutal public course where a sign at the first tee warns: 'The Black Course Is An Extremely Difficult Course Which We Recommend Only For Highly Skilled Golfers.' Bethpage Black has hosted two U.S. Opens (2002, 2009), the 2019 PGA Championship, and the 2025 Ryder Cup. Tillinghast's design features deep cross-bunkers, elevated greens, and long carries over waste areas. What makes Bethpage special is accessibility — this is a New York State public facility where everyday golfers can camp out overnight for a tee time on the same course where Tiger Woods won his 2002 U.S. Open.",
        amenities: "Pro Shop, Clubhouse Restaurant, Practice Range, 5 Total Courses, Snack Bar, Locker Room",
        phone: "(516) 249-0707",
        website: "https://parks.ny.gov/golf-courses/bethpage",
        imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600", "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600"],
      },
      {
        name: "Torrey Pines South Course",
        location: "11480 N Torrey Pines Rd",
        city: "La Jolla",
        state: "CA",
        holes: 18,
        par: 72,
        rating: 4.4,
        slope: 143,
        yardage: 7607,
        greenFee: 202,
        courseType: "Municipal",
        designer: "William F. Bell (redesigned by Rees Jones)",
        yearBuilt: 1957,
        description: "Perched on dramatic sandstone bluffs 300 feet above the Pacific Ocean, Torrey Pines South is America's most scenic municipal course. The 2001 Rees Jones redesign transformed it into a championship venue worthy of hosting the 2008 and 2021 U.S. Opens. The par-3 3rd hole plays downhill toward the ocean, while the 4th tee offers sweeping views of the coastline, hang gliders soaring below, and the Torrey Pines State Natural Reserve. San Diego residents enjoy discounted rates — making this one of the greatest public golf values in the country.",
        amenities: "Pro Shop, The Grill at Torrey Pines, Practice Range, Putting Green, Short Game Area, Lodge at Torrey Pines, 36 Holes (North & South)",
        phone: "(858) 452-3226",
        website: "https://www.torreypinesgolfcourse.com",
        imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600", "https://images.unsplash.com/photo-1592919505780-303950717480?w=600"],
      },
      {
        name: "Whistling Straits - Straits Course",
        location: "N8501 County Rd LS",
        city: "Haven",
        state: "WI",
        holes: 18,
        par: 72,
        rating: 4.5,
        slope: 151,
        yardage: 7390,
        greenFee: 395,
        courseType: "Resort",
        designer: "Pete Dye",
        yearBuilt: 1998,
        description: "Built on a former airfield along the shores of Lake Michigan, Whistling Straits was transformed by Pete Dye into a links-style masterpiece that could pass for the coast of Ireland. Featuring over 1,000 bunkers (yes, one thousand — as Dustin Johnson famously discovered in 2010), massive dunes, fescue-covered mounds, and grazing Scottish Blackface sheep, this course is pure theater. Host of three PGA Championships and the triumphant 2021 Ryder Cup, the Straits Course finishes with a dramatic par-4 18th along the lakeshore where crowds pack a natural amphitheater.",
        amenities: "Pro Shop, Irish Pub & Restaurant, Caddie Service (Walking Only), Practice Facility, 36 Holes, Kohler Resort Access, Horse-Drawn Cart Tours",
        phone: "(920) 565-6050",
        website: "https://www.americanclubresort.com/golf",
        imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600", "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=600"],
      },
      {
        name: "Kiawah Island - Ocean Course",
        location: "1000 Ocean Course Dr",
        city: "Kiawah Island",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.6,
        slope: 153,
        yardage: 7356,
        greenFee: 423,
        courseType: "Resort",
        designer: "Pete Dye",
        yearBuilt: 1991,
        description: "The Ocean Course at Kiawah Island was built specifically to host the 1991 Ryder Cup — the legendary 'War by the Shore' — and Pete Dye delivered a course worthy of that drama. Every hole offers views of the Atlantic Ocean, with ten holes playing directly along the coast. The relentless Lowcountry wind can shift a 7,000-yard course into a 7,800-yard monster. The elevated fairways and dunes create a links feel unique to America, while the marsh-fringed finishing holes demand both courage and precision. Host of the 2012 and 2021 PGA Championships.",
        amenities: "Pro Shop, Atlantic Room Restaurant, Caddie Program, Practice Range, Ryder Cup Bar, Resort Pool, Sanctuary Hotel, Nature Tours",
        phone: "(843) 266-4670",
        website: "https://www.kiawahresort.com/golf",
        imageUrl: "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600", "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600"],
      },
      {
        name: "Bandon Dunes",
        location: "57744 Round Lake Dr",
        city: "Bandon",
        state: "OR",
        holes: 18,
        par: 72,
        rating: 4.8,
        slope: 146,
        yardage: 6732,
        greenFee: 345,
        courseType: "Resort",
        designer: "David McLay Kidd",
        yearBuilt: 1999,
        description: "The original course at the Bandon Dunes Golf Resort launched a revolution in American golf. Perched on towering bluffs above the wild Oregon coast, this pure links layout plays through massive sand dunes and native gorse, with five holes offering direct ocean views. No carts allowed — every round is walked with a caddie, creating an intimate connection with the landscape. The constant wind off the Pacific turns every shot into an adventure. Bandon Dunes proved that Americans would embrace walking-only, links-style golf — spawning four additional world-class courses on the property.",
        amenities: "Pro Shop, The Gallery Restaurant, Bunker Bar, Caddie Service, Practice Center, Lodge & Resort Rooms, McKee's Pub, Trails Course, Preserve Course",
        phone: "(541) 347-4380",
        website: "https://www.bandondunesgolf.com",
        imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1592919505780-303950717480?w=600", "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600"],
      },
      {
        name: "Oakmont Country Club",
        location: "1233 Hulton Rd",
        city: "Oakmont",
        state: "PA",
        holes: 18,
        par: 71,
        rating: 4.7,
        slope: 155,
        yardage: 7255,
        greenFee: 0,
        courseType: "Private",
        designer: "Henry Fownes",
        yearBuilt: 1903,
        description: "Consistently ranked among the most difficult courses in America, Oakmont's hallmark is its blazing-fast greens and fearsome 'church pew' bunkers — a series of grass-topped ridges between parallel sand traps that have swallowed dreams since 1903. The club has hosted a record nine U.S. Opens, with champions ranging from Ben Hogan to Dustin Johnson. The greens are famously the fastest in championship golf, regularly exceeding 14 on the Stimpmeter. Henry Fownes designed every hole to be reachable yet terrifying, creating a course that rewards only the most precise iron play.",
        amenities: "Pro Shop, Formal Dining, Grillroom, Locker Rooms, Swimming Pool, Tennis Courts, Practice Facility, Historic Clubhouse",
        phone: "(412) 828-8000",
        website: "https://www.oakmont-countryclub.org",
        imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600", "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600"],
      },
      {
        name: "Cypress Point Club",
        location: "3150 17-Mile Drive",
        city: "Pebble Beach",
        state: "CA",
        holes: 18,
        par: 72,
        rating: 4.9,
        slope: 142,
        yardage: 6536,
        greenFee: 0,
        courseType: "Private",
        designer: "Alister MacKenzie",
        yearBuilt: 1928,
        description: "Many golf architects consider Cypress Point the single greatest golf course ever built. Alister MacKenzie routed 18 holes through three distinct landscapes — forested dunes, oceanside headlands, and the iconic cypress groves that give the club its name. The par-3 16th, playing 219 yards across the open Pacific to a green nestled among rocks and ice plant, is arguably the most famous hole in golf. With only 250 members and a decades-long waitlist, Cypress Point remains golf's most exclusive sanctuary. The course is short by modern standards but endlessly strategic.",
        amenities: "Pro Shop, Clubhouse Dining, Caddie Service, Practice Area, Private Beach, Guest Cottages",
        phone: "(831) 624-2223",
        imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600", "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=600"],
      },
      {
        name: "Shinnecock Hills Golf Club",
        location: "200 Tuckahoe Rd",
        city: "Southampton",
        state: "NY",
        holes: 18,
        par: 70,
        rating: 4.7,
        slope: 149,
        yardage: 7445,
        greenFee: 0,
        courseType: "Private",
        designer: "William Flynn",
        yearBuilt: 1891,
        description: "One of the five founding member clubs of the USGA, Shinnecock Hills is America's oldest incorporated golf club. Set on windswept terrain overlooking Peconic Bay and the Atlantic Ocean, the course plays through native fescue and open, rolling landscape that evokes the great links of Scotland and Ireland. William Flynn's 1931 redesign created the masterpiece we see today — wide fairways that narrow at landing areas, greens angled to reject imprecise approaches, and a constant, swirling wind that makes club selection an art form. Host of five U.S. Opens.",
        amenities: "Pro Shop, Stanford White Clubhouse (1892), Dining Room, Locker Rooms, Practice Facility, Tennis, Swimming",
        phone: "(631) 283-3525",
        website: "https://www.shinnecockgolf.com",
        imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600", "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600"],
      },
      {
        name: "Merion Golf Club - East Course",
        location: "450 Ardmore Ave",
        city: "Ardmore",
        state: "PA",
        holes: 18,
        par: 70,
        rating: 4.6,
        slope: 148,
        yardage: 6846,
        greenFee: 0,
        courseType: "Private",
        designer: "Hugh Wilson",
        yearBuilt: 1912,
        description: "Don't let the modest yardage fool you — Merion East is a tiger. This compact masterpiece on Philadelphia's Main Line has hosted more USGA championships than any other course, including the 2013 U.S. Open. Hugh Wilson, a 28-year-old amateur, designed it after studying the great courses of Scotland, and the result is an endlessly strategic layout. The famed 'wicker baskets' atop the flagsticks (replacing traditional flags) are a Merion signature. The finishing stretch through an old rock quarry is among the most dramatic in championship golf.",
        amenities: "Pro Shop, Clubhouse, Formal Dining, Locker Rooms, Cricket Pitch, Practice Range, West Course (18 holes)",
        phone: "(610) 642-5600",
        imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600"],
      },
      {
        name: "Streamsong Resort - Red Course",
        location: "1000 Streamsong Dr",
        city: "Streamsong",
        state: "FL",
        holes: 18,
        par: 72,
        rating: 4.5,
        slope: 145,
        yardage: 7050,
        greenFee: 275,
        courseType: "Resort",
        designer: "Coore & Crenshaw",
        yearBuilt: 2012,
        description: "Built on reclaimed phosphate mining land in central Florida, Streamsong Red defies every expectation of Florida golf. The massive sand dunes, created by decades of mining, rival anything found on the coasts of Ireland. Coore & Crenshaw crafted a strategic, natural layout with wide fairways, creative bunkering, and contoured greens that reward imagination over brute force. The course sits alongside two equally impressive siblings (Blue by Tom Doak, Black by Gil Hanse), making Streamsong a destination that rivals Bandon Dunes for pure golf immersion.",
        amenities: "Pro Shop, Clubhouse Restaurant, AcquaPura Spa, Resort Hotel, Bass Fishing, Sporting Clays, Infinity Pool, 54 Holes Total",
        phone: "(863) 428-1000",
        website: "https://www.streamsongresort.com",
        imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=600", "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600"],
      },
      {
        name: "Cabot Cliffs",
        location: "5795 Cabot Trail",
        city: "Inverness",
        state: "NS",
        holes: 18,
        par: 72,
        rating: 4.8,
        slope: 143,
        yardage: 6764,
        greenFee: 310,
        courseType: "Resort",
        designer: "Coore & Crenshaw",
        yearBuilt: 2015,
        description: "Carved along the dramatic cliffs of Cape Breton Island overlooking the Gulf of St. Lawrence, Cabot Cliffs debuted at #19 in the world and has only risen since. The clifftop 16th — a short par-3 with a 100-foot drop to the sea behind the green — is an instant icon. Coore & Crenshaw created a course that transitions seamlessly from dense forest to open headlands to towering cliff edges, each section more dramatic than the last. Paired with sister course Cabot Links (Rod Whitman, 2012), this remote Nova Scotia resort has become one of golf's most coveted pilgrimages.",
        amenities: "Pro Shop, Panorama Restaurant, Cabot Bar, Resort Hotel, Spa, Practice Facility, Cabot Links Course, Beach, Hiking Trails",
        phone: "(855) 652-2268",
        website: "https://www.cabotcapebreton.com",
        imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600", "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600"],
      },
      {
        name: "Sand Valley Golf Resort",
        location: "1697 Leopold Way",
        city: "Nekoosa",
        state: "WI",
        holes: 18,
        par: 71,
        rating: 4.6,
        slope: 140,
        yardage: 6841,
        greenFee: 225,
        courseType: "Resort",
        designer: "Coore & Crenshaw",
        yearBuilt: 2017,
        description: "Set in the ancient sandy glacial landscape of central Wisconsin, Sand Valley feels like playing golf on the surface of another planet. Massive sand blowouts, towering pines, and wild fescue grasses frame a course that Coore & Crenshaw designed to look like it's been here for centuries. The par-3 17th, playing over a vast sand crater, is a hole you'll never forget. Walking-only and caddie-encouraged, Sand Valley captures the spirit of Bandon Dunes in the heartland. The resort also features Mammoth Dunes (Hanse) and The Lido (Doak) — a recreation of the legendary lost course.",
        amenities: "Pro Shop, Craig's Porch Restaurant, Lodge Rooms, Cottages, Practice Facility, Mammoth Dunes Course, The Lido, Sand Box (par-3), Hiking",
        phone: "(888) 651-5539",
        website: "https://www.sandvalley.com",
        imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1600166898405-da9535204843?w=600", "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=600"],
      },
      {
        name: "Pacific Dunes",
        location: "57744 Round Lake Dr",
        city: "Bandon",
        state: "OR",
        holes: 18,
        par: 71,
        rating: 4.9,
        slope: 148,
        yardage: 6633,
        greenFee: 345,
        courseType: "Resort",
        designer: "Tom Doak",
        yearBuilt: 2001,
        description: "Widely considered the crown jewel of Bandon Dunes Resort and perennially ranked among the top five public courses in America. Tom Doak routed 13 holes with ocean views along the bluffs of the southern Oregon coast, creating a links masterpiece that captures the raw beauty and strategic challenge of the great Scottish and Irish courses. The par-4 11th, a dogleg right along the cliff edge, and the par-3 10th, a wild downhill pitch to a green on a rocky promontory, are two of the finest holes in world golf. Walking only with caddie.",
        amenities: "Pro Shop, Pacific Grill, Bunker Bar, Caddie Service, Practice Range, Resort Lodge, McKee's Pub, 5 Championship Courses on Property",
        phone: "(541) 347-4380",
        website: "https://www.bandondunesgolf.com",
        imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1592919505780-303950717480?w=600", "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600"],
      },
      {
        name: "Winged Foot Golf Club - West",
        location: "851 Fenimore Rd",
        city: "Mamaroneck",
        state: "NY",
        holes: 18,
        par: 72,
        rating: 4.7,
        slope: 150,
        yardage: 7477,
        greenFee: 0,
        courseType: "Private",
        designer: "A.W. Tillinghast",
        yearBuilt: 1923,
        description: "Tillinghast's masterwork in suburban New York is one of golf's ultimate tests. The West Course has hosted six U.S. Opens, producing some of the sport's most memorable moments — from Hale Irwin's 7-over winning score in the 'Massacre at Winged Foot' (1974) to Bryson DeChambeau's power-golf triumph in 2020. Deep bunkers, small angled greens, and thick Northeastern rough define the challenge. The 72nd hole has been the setting for more championship drama than perhaps any hole in golf history.",
        amenities: "Pro Shop, Clubhouse, Formal Dining, Grillroom, East Course (18 holes), Tennis, Swimming, Paddle Tennis, Practice Facility",
        phone: "(914) 698-8400",
        imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600"],
      },
      {
        name: "Chambers Bay",
        location: "6320 Grandview Dr W",
        city: "University Place",
        state: "WA",
        holes: 18,
        par: 72,
        rating: 4.3,
        slope: 144,
        yardage: 7585,
        greenFee: 219,
        courseType: "Municipal",
        designer: "Robert Trent Jones Jr.",
        yearBuilt: 2007,
        description: "A municipal course that hosted the 2015 U.S. Open — an almost unheard-of achievement. Built on a former sand and gravel mine along Puget Sound, Chambers Bay is a true links course in the Pacific Northwest, with fescue fairways, a single tree on the property, and dramatic views of the Puget Sound, Olympic Mountains, and Mount Rainier. The course features massive elevation changes, blind shots, and a reversible 9th/18th hole that can play as either a par-3 or par-4. Walking is encouraged; the remote setting creates a pilgrimage atmosphere.",
        amenities: "Pro Shop, The Yard Restaurant, Practice Facility, Walking Paths, Puget Sound Views, Event Pavilion",
        phone: "(253) 460-4653",
        website: "https://www.chambersbaygolf.com",
        imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=600"],
      },
      {
        name: "The Old Course at St Andrews",
        location: "St Andrews Links",
        city: "St Andrews",
        state: "Scotland",
        holes: 18,
        par: 72,
        rating: 4.9,
        slope: 132,
        yardage: 7305,
        greenFee: 295,
        courseType: "Public",
        designer: "Old Tom Morris (evolved over 600+ years)",
        yearBuilt: 1400,
        description: "The birthplace of golf. The Old Course at St Andrews has been played for over 600 years, making it the oldest and most storied course in the world. The layout is a loop — seven massive double greens serve holes going out and coming back, creating a unique and sometimes confusing playing experience. The Road Hole (17th) is universally regarded as the hardest par-4 in golf, while the 18th plays through the heart of town with the iconic Swilcan Bridge and the Royal & Ancient Clubhouse as a backdrop. Ballot-based tee times ensure this remains a truly public course.",
        amenities: "Pro Shop, Links Clubhouse, Caddie Pavilion, Practice Center, Himalayas Putting Course, Eden Clubhouse, 7 Golf Courses, St Andrews Town",
        phone: "+44 1334 466666",
        website: "https://www.standrews.com",
        imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
        galleryImages: ["https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600", "https://images.unsplash.com/photo-1592919505780-303950717480?w=600", "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600"],
      },
    ];

    for (const course of sampleCourses) {
      await storage.createCourse(course as any);
    }

    const sampleDeals = [
      { courseName: "Torrey Pines South", title: "Twilight Special", description: "Play the famous Torrey Pines after 2pm at a discounted rate. Cart included.", originalPrice: 202, dealPrice: 129, discountPercent: 36, isHot: true, imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800" },
      { courseName: "Bethpage Black", title: "Weekday Deal", description: "Monday-Thursday rounds with cart at NY's toughest public course.", originalPrice: 150, dealPrice: 99, discountPercent: 34, isHot: true, imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800" },
      { courseName: "TPC Sawgrass", title: "Stay & Play Package", description: "One night stay plus one round on the Stadium Course. A golfer's dream.", originalPrice: 450, dealPrice: 349, discountPercent: 22, isHot: false, imageUrl: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800" },
      { courseName: "Pinehurst No. 2", title: "Resort Package", description: "Two nights accommodation plus unlimited golf on all eight Pinehurst courses.", originalPrice: 395, dealPrice: 299, discountPercent: 24, isHot: false, imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800" },
      { courseName: "Kiawah Island Ocean Course", title: "Early Bird Special", description: "First tee time of the day with complimentary breakfast at the clubhouse.", originalPrice: 423, dealPrice: 329, discountPercent: 22, isHot: true, imageUrl: "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=800" },
    ];

    for (const deal of sampleDeals) {
      await storage.createDeal(deal as any);
    }

    res.json({ message: "Seeded successfully", courses: sampleCourses.length, deals: sampleDeals.length });
  });

  const httpServer = createServer(app);
  return httpServer;
}
