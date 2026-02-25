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
      { name: "Augusta National Golf Club", location: "2604 Washington Rd", city: "Augusta", state: "GA", holes: 18, par: 72, rating: 4.9, slope: 148, yardage: 7475, greenFee: 350, description: "Home of The Masters Tournament, one of the most iconic courses in the world.", amenities: "Pro Shop, Restaurant, Caddie Service, Practice Range", phone: "(706) 667-6000", imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800" },
      { name: "Pebble Beach Golf Links", location: "1700 17-Mile Drive", city: "Pebble Beach", state: "CA", holes: 18, par: 72, rating: 4.8, slope: 145, yardage: 6828, greenFee: 575, description: "Stunning oceanside course on the Monterey Peninsula with breathtaking views.", amenities: "Pro Shop, Resort, Spa, Restaurants, Practice Facility", phone: "(831) 622-8723", imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800" },
      { name: "TPC Sawgrass", location: "110 Championship Way", city: "Ponte Vedra Beach", state: "FL", holes: 18, par: 72, rating: 4.7, slope: 155, yardage: 7215, greenFee: 450, description: "Home of THE PLAYERS Championship, featuring the iconic Island Green on Hole 17.", amenities: "Pro Shop, Clubhouse, Dining, Practice Range, Caddies", phone: "(904) 273-3235", imageUrl: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800" },
      { name: "Pinehurst No. 2", location: "80 Carolina Vista", city: "Pinehurst", state: "NC", holes: 18, par: 72, rating: 4.6, slope: 144, yardage: 7588, greenFee: 395, description: "Historic Donald Ross design, host of multiple U.S. Opens.", amenities: "Pro Shop, Resort, Multiple Courses, Spa, Dining", phone: "(910) 235-8507", imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800" },
      { name: "Bethpage Black", location: "99 Quaker Meeting House Rd", city: "Farmingdale", state: "NY", holes: 18, par: 71, rating: 4.5, slope: 152, yardage: 7468, greenFee: 150, description: "Public course that has hosted multiple major championships. Brutally challenging.", amenities: "Pro Shop, Clubhouse, Practice Range, Restaurant", phone: "(516) 249-0707", imageUrl: "https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800" },
      { name: "Torrey Pines South", location: "11480 N Torrey Pines Rd", city: "La Jolla", state: "CA", holes: 18, par: 72, rating: 4.4, slope: 143, yardage: 7607, greenFee: 202, description: "Municipal course perched on cliffs above the Pacific Ocean.", amenities: "Pro Shop, Restaurant, Practice Range, Lodge", phone: "(858) 452-3226", imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=800" },
      { name: "Whistling Straits", location: "N8501 County Rd LS", city: "Haven", state: "WI", holes: 18, par: 72, rating: 4.5, slope: 151, yardage: 7390, greenFee: 395, description: "Links-style course on Lake Michigan. Host of the 2021 Ryder Cup.", amenities: "Pro Shop, Dining, Caddie Program, Practice Facility", phone: "(920) 565-6050", imageUrl: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800" },
      { name: "Kiawah Island Ocean Course", location: "1000 Ocean Course Dr", city: "Kiawah Island", state: "SC", holes: 18, par: 72, rating: 4.6, slope: 153, yardage: 7356, greenFee: 423, description: "Pete Dye masterpiece along the Atlantic coast, host of the 2021 PGA Championship.", amenities: "Pro Shop, Resort, Restaurants, Practice Facility, Caddies", phone: "(843) 266-4670", imageUrl: "https://images.unsplash.com/photo-1591491719565-9dfc9a498251?w=800" },
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
