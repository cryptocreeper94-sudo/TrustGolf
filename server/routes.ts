import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as trustvault from "./trustvault";
import { sendVerificationEmail, sendVendorConfirmationEmail } from "./resend";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CLUB_CATEGORIES_SERVER: Record<string, string> = {
  "driver": "Driver",
  "fairway-wood": "Fairway Wood",
  "hybrid": "Hybrid",
  "long-iron": "Long Iron (3-5i)",
  "mid-iron": "Mid Iron (6-7i)",
  "short-iron": "Short Iron (8-9i)",
  "pitching-wedge": "Pitching Wedge",
  "sand-lob-wedge": "Sand/Lob Wedge",
  "putter": "Putter",
};

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least 1 uppercase letter";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return "Password must contain at least 1 special character";
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const path = require("path");
  const express = require("express");
  app.use("/hero-videos", express.static(path.resolve(process.cwd(), "server/public/videos"), { maxAge: "30d" }));

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) return res.status(409).json({ error: "Username already taken" });

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await storage.createUser({
      username,
      email,
      password: passwordHash,
      displayName: displayName || username,
      verificationToken,
      emailVerified: false,
    });

    try {
      await sendVerificationEmail(email, displayName || username, verificationToken);
    } catch (err: any) {
      console.error("Failed to send verification email:", err.message);
    }

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      handicap: user.handicap,
      emailVerified: user.emailVerified,
    });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing credentials" });

    let user = await storage.getUserByUsername(username);
    if (!user) {
      user = await storage.getUserByEmail(username);
    }
    if (!user) return res.status(401).json({ error: "Invalid username or email" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      if (user.password === password) {
        const hashed = await bcrypt.hash(password, 12);
        await storage.updateUser(user.id, { password: hashed });
      } else {
        return res.status(401).json({ error: "Invalid password" });
      }
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      handicap: user.handicap,
      emailVerified: user.emailVerified,
      age: user.age,
      swingSpeed: user.swingSpeed,
      avgDriveDistance: user.avgDriveDistance,
      golfGoals: user.golfGoals,
    });
  });

  app.get("/api/auth/verify", async (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) return res.status(400).send("Missing verification token");

    const user = await storage.getUserByVerificationToken(token);
    if (!user) return res.status(404).send("Invalid or expired verification token");

    await storage.updateUser(user.id, { emailVerified: true, verificationToken: null as any });

    res.send(`
      <html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#0D3B12;color:#fff;flex-direction:column;">
        <h1 style="color:#C5A55A;">Email Verified!</h1>
        <p>Your Trust Golf account is now verified. You can close this tab.</p>
      </body></html>
    `);
  });

  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    const { userId, displayName, age, height, swingSpeed, avgDriveDistance, flexibilityLevel, golfGoals, clubDistances } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updated = await storage.updateUser(userId, {
      displayName: displayName ?? user.displayName,
      age: age ?? user.age,
      height: height ?? user.height,
      swingSpeed: swingSpeed ?? user.swingSpeed,
      avgDriveDistance: avgDriveDistance ?? user.avgDriveDistance,
      flexibilityLevel: flexibilityLevel ?? user.flexibilityLevel,
      golfGoals: golfGoals ?? user.golfGoals,
      clubDistances: clubDistances ?? user.clubDistances,
    });

    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      displayName: updated.displayName,
      handicap: updated.handicap,
      emailVerified: updated.emailVerified,
      age: updated.age,
      height: updated.height,
      swingSpeed: updated.swingSpeed,
      avgDriveDistance: updated.avgDriveDistance,
      flexibilityLevel: updated.flexibilityLevel,
      golfGoals: updated.golfGoals,
      clubDistances: updated.clubDistances,
    });
  });

  app.get("/api/auth/user/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      handicap: user.handicap,
      emailVerified: user.emailVerified,
      age: user.age,
      height: user.height,
      swingSpeed: user.swingSpeed,
      avgDriveDistance: user.avgDriveDistance,
      flexibilityLevel: user.flexibilityLevel,
      golfGoals: user.golfGoals,
      clubDistances: user.clubDistances,
    });
  });

  function resolveImageUrl(url: string | null, req: Request): string | null {
    if (!url) return url;
    if (url.startsWith("/")) {
      return `${req.protocol}://${req.get("host")}${url}`;
    }
    return url;
  }

  function resolveCourseImages(course: any, req: Request) {
    return {
      ...course,
      imageUrl: resolveImageUrl(course.imageUrl, req),
      galleryImages: Array.isArray(course.galleryImages)
        ? course.galleryImages.map((u: string) => resolveImageUrl(u, req))
        : course.galleryImages,
    };
  }

  app.get("/api/courses", async (req: Request, res: Response) => {
    const allCourses = await storage.getCourses();
    res.json(allCourses.map((c: any) => resolveCourseImages(c, req)));
  });

  app.get("/api/courses/:id", async (req: Request, res: Response) => {
    const course = await storage.getCourse(parseInt(req.params.id));
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(resolveCourseImages(course, req));
  });

  app.post("/api/courses", async (req: Request, res: Response) => {
    const course = await storage.createCourse(req.body);
    res.status(201).json(course);
  });

  app.put("/api/courses/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const updated = await storage.updateCourse(id, req.body);
    res.json(updated);
  });

  app.delete("/api/courses/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCourse(id);
    res.json({ deleted });
  });

  app.get("/api/rounds/:userId", async (req: Request, res: Response) => {
    const userRounds = await storage.getRounds(req.params.userId);
    res.json(userRounds);
  });

  app.post("/api/rounds", async (req: Request, res: Response) => {
    const round = await storage.createRound(req.body);
    res.status(201).json(round);
  });

  app.get("/api/deals", async (req: Request, res: Response) => {
    const allDeals = await storage.getDeals();
    res.json(allDeals.map((d: any) => ({
      ...d,
      imageUrl: resolveImageUrl(d.imageUrl, req),
    })));
  });

  app.post("/api/deals", async (req: Request, res: Response) => {
    const deal = await storage.createDeal(req.body);
    res.status(201).json(deal);
  });

  app.post("/api/vendor-applications", async (req: Request, res: Response) => {
    try {
      const { businessName, contactName, email, phone, location, businessType, message, partnershipTier } = req.body;
      if (!businessName || !contactName || !email || !businessType) {
        return res.status(400).json({ error: "Business name, contact name, email, and business type are required" });
      }
      const application = await storage.createVendorApplication({
        businessName, contactName, email, phone, location, businessType,
        message, partnershipTier: partnershipTier || "free_listing",
      });
      try {
        await sendVendorConfirmationEmail(email, businessName, contactName, application.partnershipTier);
      } catch (emailErr: any) {
        console.error("Failed to send vendor confirmation email:", emailErr.message);
      }
      res.status(201).json(application);
    } catch (err: any) {
      console.error("Vendor application error:", err);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  app.get("/api/vendor-applications", async (req: Request, res: Response) => {
    const applications = await storage.getVendorApplications();
    res.json(applications);
  });

  app.patch("/api/vendor-applications/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Valid status required: pending, approved, rejected" });
      }
      const updated = await storage.updateVendorApplicationStatus(id, status, notes);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  function parseDevice(ua: string): string {
    if (/mobile|android|iphone|ipad/i.test(ua)) return /ipad|tablet/i.test(ua) ? "Tablet" : "Mobile";
    return "Desktop";
  }

  function parseBrowser(ua: string): string {
    if (/edg\//i.test(ua)) return "Edge";
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
    if (/firefox/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
    if (/opera|opr/i.test(ua)) return "Opera";
    return "Other";
  }

  app.post("/api/analytics/session", async (req: Request, res: Response) => {
    try {
      const { visitorId, sessionId, landingPage, referrer, utmSource, utmMedium, utmCampaign } = req.body;
      if (!visitorId || !sessionId) return res.status(400).json({ error: "visitorId and sessionId required" });
      const ua = req.headers["user-agent"] || "";
      const session = await storage.createAnalyticsSession({
        visitorId, sessionId, landingPage, referrer,
        utmSource, utmMedium, utmCampaign,
        userAgent: ua,
        device: parseDevice(ua),
        browser: parseBrowser(ua),
      });
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.post("/api/analytics/pageview", async (req: Request, res: Response) => {
    try {
      const { visitorId, sessionId, path, title, referrer } = req.body;
      if (!visitorId || !sessionId || !path) return res.status(400).json({ error: "visitorId, sessionId, and path required" });
      const pv = await storage.createPageView({ visitorId, sessionId, path, title, referrer });
      res.json(pv);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to track pageview" });
    }
  });

  app.post("/api/analytics/event", async (req: Request, res: Response) => {
    try {
      const { visitorId, sessionId, eventName, category, label, value, metadata } = req.body;
      if (!visitorId || !sessionId || !eventName) return res.status(400).json({ error: "visitorId, sessionId, and eventName required" });
      const event = await storage.createAnalyticsEvent({ visitorId, sessionId, eventName, category, label, value, metadata });
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  app.post("/api/analytics/session/:sessionId/end", async (req: Request, res: Response) => {
    try {
      await storage.endAnalyticsSession(req.params.sessionId);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  app.get("/api/analytics/summary", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const summary = await storage.getAnalyticsSummary(days);
    res.json(summary);
  });

  app.get("/api/analytics/realtime", async (_req: Request, res: Response) => {
    const active = await storage.getRealtimeVisitors();
    res.json({ active });
  });

  app.get("/api/analytics/traffic", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getTrafficData(days);
    res.json(data);
  });

  app.get("/api/analytics/pages", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getTopPages(days);
    res.json(data);
  });

  app.get("/api/analytics/referrers", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getTopReferrers(days);
    res.json(data);
  });

  app.get("/api/analytics/devices", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getDeviceBreakdown(days);
    res.json(data);
  });

  app.get("/api/analytics/browsers", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getBrowserBreakdown(days);
    res.json(data);
  });

  app.get("/api/analytics/events", async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const data = await storage.getRecentEvents(days);
    res.json(data);
  });

  app.get("/api/blog", async (req: Request, res: Response) => {
    const status = req.query.status as string || undefined;
    const posts = await storage.getBlogPosts(status === "all" ? undefined : (status || "published"));
    res.json(posts);
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  });

  app.post("/api/blog", async (req: Request, res: Response) => {
    try {
      const { title, slug, excerpt, content, coverImage, category, tags, authorName, status } = req.body;
      if (!title || !content) return res.status(400).json({ error: "Title and content required" });
      const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const post = await storage.createBlogPost({
        title, slug: finalSlug, excerpt, content, coverImage,
        category: category || "general",
        tags: tags || "",
        authorName: authorName || "Trust Golf",
        status: status || "draft",
        publishedAt: status === "published" ? new Date() : null,
      });
      res.status(201).json(post);
    } catch (err: any) {
      if (err.message?.includes("unique")) return res.status(409).json({ error: "A post with this slug already exists" });
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.patch("/api/blog/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      if (data.status === "published" && !data.publishedAt) {
        data.publishedAt = new Date();
      }
      if (data.title && !data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      const updated = await storage.updateBlogPost(id, data);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/blog/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteBlogPost(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.post("/api/blog/generate", async (req: Request, res: Response) => {
    try {
      const { topic, category, tone } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic required" });

      const systemPrompt = `You are an expert golf content writer for Trust Golf, a premium golf platform by DarkWave Studios LLC. Write SEO-optimized blog posts that drive organic search traffic. Target keywords naturally. Write in ${tone || "professional yet approachable"} tone.

Return a JSON object with these fields:
- title: SEO-friendly headline (60 chars max)
- slug: URL-friendly slug
- excerpt: Compelling meta description (155 chars max)
- content: Full article in Markdown format (800-1200 words). Use ## for h2, ### for h3, **bold**, *italic*, bullet lists, and numbered lists. Include a strong intro, 3-5 main sections, and a conclusion with a call to action.
- tags: Comma-separated relevant tags
- category: "${category || "tips"}"

IMPORTANT: Return ONLY valid JSON, no markdown code fences.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Write a blog post about: ${topic}` },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      res.json(parsed);
    } catch (err: any) {
      console.error("Blog generation error:", err.message);
      res.status(500).json({ error: "Failed to generate blog post" });
    }
  });

  app.get("/api/swing-analyses/:userId", async (req: Request, res: Response) => {
    const analyses = await storage.getSwingAnalyses(req.params.userId);
    res.json(analyses);
  });

  app.post("/api/swing-analyze", async (req: Request, res: Response) => {
    const { userId, imageBase64, clubType } = req.body;
    if (!userId || !imageBase64) return res.status(400).json({ error: "Missing userId or image" });

    const clubPrompts: Record<string, string> = {
      "driver": "The golfer is using a DRIVER. Focus on: wide takeaway arc, full shoulder turn, hip rotation generating power, upward angle of attack (hitting up on the ball), tee height, weight transfer to front foot, and full extension through impact. Check for over-the-top move, slice-producing path, and whether the swing plane is appropriate for a driver.",
      "fairway-wood": "The golfer is using a FAIRWAY WOOD (3W/5W/7W). Focus on: sweeping contact (not hitting down steeply), ball position slightly forward of center, shallow angle of attack, smooth tempo, and whether the golfer is trying to help the ball up instead of trusting the loft. Check for proper spine angle maintenance.",
      "hybrid": "The golfer is using a HYBRID CLUB. Focus on: ball position center to slightly forward, descending but shallow angle of attack, smooth transition, and whether the golfer is swinging it more like an iron (correct) vs. sweeping like a wood. Check for proper weight shift and clean contact.",
      "long-iron": "The golfer is using a LONG IRON (3-5 iron). Focus on: flatter swing plane, ball-first contact with forward shaft lean, proper weight transfer, maintaining spine angle through impact, and full follow-through. These are demanding clubs — check for casting, early release, and whether the golfer maintains lag.",
      "mid-iron": "The golfer is using a MID IRON (6-7 iron). Focus on: consistent ball-first contact, proper divot location (after the ball), balanced stance width, controlled backswing length, and clean impact position. Check grip pressure, alignment, and whether the hands are ahead of the clubhead at impact.",
      "short-iron": "The golfer is using a SHORT IRON (8-9 iron). Focus on: precision and control over distance, ball position center of stance, descending strike with proper compression, consistent tempo, and accuracy of aim. Check for deceleration through impact and whether the golfer is committing to the shot.",
      "pitching-wedge": "The golfer is using a PITCHING WEDGE. Focus on: controlled, three-quarter swing, distance control, consistent ball-first contact, proper follow-through length matching backswing length, and body rotation rather than arms-only swing. Check for proper bounce usage and whether the hands lead through impact.",
      "sand-lob-wedge": "The golfer is using a SAND or LOB WEDGE. Focus on: open clubface technique, wrist hinge, splash technique for bunkers, soft landing trajectory, touch and feel around the green, and whether the golfer accelerates through the ball. Check for proper setup (open stance, ball position), and flop shot technique if applicable.",
      "putter": "The golfer is using a PUTTER. This is a completely different analysis — do NOT evaluate full swing mechanics. Instead focus on: stroke path (straight-back-straight-through vs. slight arc), face angle at impact, tempo and rhythm, eye position over the ball, shoulder rock vs. arm swing, grip style (conventional, cross-hand, claw), distance control, and whether the lower body stays completely still. Replace backswing/downswing/followThrough with: strokePath, faceControl, and distanceControl in your response.",
    };

    const clubContext = clubType && clubPrompts[clubType] ? `\n\nIMPORTANT CLUB CONTEXT: ${clubPrompts[clubType]}` : "";
    const clubLabel = clubType ? CLUB_CATEGORIES_SERVER[clubType] || clubType : "unknown club";

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert golf swing analyst and PGA-certified instructor. Analyze the golf swing image provided and give detailed, actionable feedback tailored to the specific club being used.${clubContext}

Structure your response as JSON with these fields:
{
  "overallScore": (number 1-100),
  "clubType": "${clubLabel}",
  "grip": { "score": (1-10), "feedback": "..." },
  "stance": { "score": (1-10), "feedback": "..." },
  "backswing": { "score": (1-10), "feedback": "..." },
  "downswing": { "score": (1-10), "feedback": "..." },
  "impact": { "score": (1-10), "feedback": "..." },
  "followThrough": { "score": (1-10), "feedback": "..." },
  "tempo": { "score": (1-10), "feedback": "..." },
  "estimatedLaunchData": {
    "ballSpeed": (estimated mph based on swing mechanics observed),
    "launchAngle": (estimated degrees),
    "carryDistance": (estimated yards),
    "totalDistance": (estimated yards including roll),
    "spinRate": (estimated RPM),
    "swingPath": "inside-out" | "outside-in" | "straight"
  },
  "summary": "Brief overall assessment mentioning the specific club",
  "topTips": ["tip1", "tip2", "tip3"],
  "drills": ["drill1 specific to this club type", "drill2"]
}

IMPORTANT: For "estimatedLaunchData", estimate realistic values based on the swing mechanics you observe, the club type, and typical amateur golfer data. These are AI-estimated values meant to give the golfer a sense of their likely ball flight characteristics.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this golf swing${clubType ? ` with a ${clubLabel}` : ""} and provide detailed feedback:` },
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
      return res.json({ totalRounds: 0, averageScore: 0, bestScore: 0, handicapIndex: null, recentTrend: [] });
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

    let handicapIndex: number | null = null;
    if (totalRounds >= 3) {
      const allCourses = await storage.getCourses();
      const courseMap = new Map(allCourses.map(c => [c.id, c]));

      const differentials: number[] = [];
      for (const round of userRounds) {
        const course = round.courseId ? courseMap.get(round.courseId) : null;
        const courseRating = course?.rating || 72.0;
        const slopeRating = course?.slope || 113;
        const diff = ((round.totalScore - courseRating) * 113) / slopeRating;
        differentials.push(parseFloat(diff.toFixed(1)));
      }

      differentials.sort((a, b) => a - b);

      let useDiffs: number;
      if (totalRounds <= 4) useDiffs = 1;
      else if (totalRounds <= 6) useDiffs = 2;
      else if (totalRounds <= 8) useDiffs = 3;
      else if (totalRounds <= 11) useDiffs = 4;
      else if (totalRounds <= 14) useDiffs = 5;
      else if (totalRounds <= 16) useDiffs = 6;
      else if (totalRounds <= 18) useDiffs = 7;
      else useDiffs = 8;

      const bestDiffs = differentials.slice(0, useDiffs);
      const avgDiff = bestDiffs.reduce((a, b) => a + b, 0) / bestDiffs.length;
      handicapIndex = parseFloat((avgDiff * 0.96).toFixed(1));
      if (handicapIndex < 0) handicapIndex = 0;

      await db.update(users).set({ handicap: handicapIndex }).where(eq(users.id, req.params.userId));
    }

    res.json({ totalRounds, averageScore, bestScore, handicapIndex, recentTrend });
  });

  app.post("/api/courses/:id/hole-data", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    await storage.updateCourse(id, { holeData: req.body } as any);
    res.json({ success: true });
  });

  app.post("/api/seed-hole-data", async (_req: Request, res: Response) => {
    const tnHoleData: Record<string, any> = {
      "Gaylord Springs Golf Links": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 378, handicap: 9 }, { hole: 2, par: 4, yardage: 402, handicap: 3 },
          { hole: 3, par: 3, yardage: 175, handicap: 15 }, { hole: 4, par: 5, yardage: 528, handicap: 7 },
          { hole: 5, par: 4, yardage: 415, handicap: 1 }, { hole: 6, par: 3, yardage: 195, handicap: 13 },
          { hole: 7, par: 4, yardage: 365, handicap: 11 }, { hole: 8, par: 5, yardage: 542, handicap: 5 },
          { hole: 9, par: 4, yardage: 390, handicap: 17 },
          { hole: 10, par: 4, yardage: 410, handicap: 4 }, { hole: 11, par: 3, yardage: 185, handicap: 16 },
          { hole: 12, par: 5, yardage: 555, handicap: 2 }, { hole: 13, par: 4, yardage: 372, handicap: 12 },
          { hole: 14, par: 4, yardage: 420, handicap: 6 }, { hole: 15, par: 3, yardage: 168, handicap: 18 },
          { hole: 16, par: 4, yardage: 395, handicap: 10 }, { hole: 17, par: 5, yardage: 515, handicap: 8 },
          { hole: 18, par: 4, yardage: 388, handicap: 14 },
        ],
      },
      "Hermitage Golf Course - President's Reserve": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 395, handicap: 5 }, { hole: 2, par: 5, yardage: 540, handicap: 9 },
          { hole: 3, par: 3, yardage: 182, handicap: 17 }, { hole: 4, par: 4, yardage: 425, handicap: 1 },
          { hole: 5, par: 4, yardage: 380, handicap: 11 }, { hole: 6, par: 3, yardage: 200, handicap: 15 },
          { hole: 7, par: 5, yardage: 555, handicap: 3 }, { hole: 8, par: 4, yardage: 365, handicap: 13 },
          { hole: 9, par: 4, yardage: 410, handicap: 7 },
          { hole: 10, par: 4, yardage: 398, handicap: 6 }, { hole: 11, par: 4, yardage: 440, handicap: 2 },
          { hole: 12, par: 3, yardage: 175, handicap: 16 }, { hole: 13, par: 5, yardage: 530, handicap: 8 },
          { hole: 14, par: 4, yardage: 385, handicap: 12 }, { hole: 15, par: 4, yardage: 405, handicap: 4 },
          { hole: 16, par: 3, yardage: 190, handicap: 18 }, { hole: 17, par: 4, yardage: 370, handicap: 14 },
          { hole: 18, par: 5, yardage: 548, handicap: 10 },
        ],
      },
      "Hermitage Golf Course - General's Retreat": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 370, handicap: 7 }, { hole: 2, par: 3, yardage: 165, handicap: 15 },
          { hole: 3, par: 5, yardage: 520, handicap: 3 }, { hole: 4, par: 4, yardage: 395, handicap: 5 },
          { hole: 5, par: 4, yardage: 350, handicap: 13 }, { hole: 6, par: 4, yardage: 415, handicap: 1 },
          { hole: 7, par: 3, yardage: 188, handicap: 17 }, { hole: 8, par: 5, yardage: 535, handicap: 9 },
          { hole: 9, par: 4, yardage: 380, handicap: 11 },
          { hole: 10, par: 4, yardage: 405, handicap: 4 }, { hole: 11, par: 5, yardage: 545, handicap: 6 },
          { hole: 12, par: 3, yardage: 172, handicap: 18 }, { hole: 13, par: 4, yardage: 388, handicap: 8 },
          { hole: 14, par: 4, yardage: 425, handicap: 2 }, { hole: 15, par: 3, yardage: 195, handicap: 16 },
          { hole: 16, par: 4, yardage: 375, handicap: 12 }, { hole: 17, par: 5, yardage: 510, handicap: 10 },
          { hole: 18, par: 4, yardage: 400, handicap: 14 },
        ],
      },
      "Nashville Golf & Athletic Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 385, handicap: 7 }, { hole: 2, par: 4, yardage: 410, handicap: 3 },
          { hole: 3, par: 3, yardage: 170, handicap: 15 }, { hole: 4, par: 5, yardage: 525, handicap: 5 },
          { hole: 5, par: 4, yardage: 400, handicap: 1 }, { hole: 6, par: 4, yardage: 360, handicap: 13 },
          { hole: 7, par: 3, yardage: 190, handicap: 17 }, { hole: 8, par: 5, yardage: 545, handicap: 9 },
          { hole: 9, par: 4, yardage: 375, handicap: 11 },
          { hole: 10, par: 4, yardage: 395, handicap: 6 }, { hole: 11, par: 3, yardage: 178, handicap: 16 },
          { hole: 12, par: 5, yardage: 535, handicap: 4 }, { hole: 13, par: 4, yardage: 420, handicap: 2 },
          { hole: 14, par: 4, yardage: 365, handicap: 12 }, { hole: 15, par: 3, yardage: 185, handicap: 18 },
          { hole: 16, par: 4, yardage: 405, handicap: 8 }, { hole: 17, par: 5, yardage: 550, handicap: 10 },
          { hole: 18, par: 4, yardage: 388, handicap: 14 },
        ],
      },
      "Harpeth Hills Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 355, handicap: 9 }, { hole: 2, par: 5, yardage: 510, handicap: 5 },
          { hole: 3, par: 3, yardage: 160, handicap: 17 }, { hole: 4, par: 4, yardage: 390, handicap: 3 },
          { hole: 5, par: 4, yardage: 375, handicap: 7 }, { hole: 6, par: 3, yardage: 175, handicap: 15 },
          { hole: 7, par: 4, yardage: 345, handicap: 13 }, { hole: 8, par: 5, yardage: 495, handicap: 1 },
          { hole: 9, par: 4, yardage: 365, handicap: 11 },
          { hole: 10, par: 4, yardage: 380, handicap: 4 }, { hole: 11, par: 4, yardage: 350, handicap: 10 },
          { hole: 12, par: 3, yardage: 155, handicap: 18 }, { hole: 13, par: 5, yardage: 505, handicap: 6 },
          { hole: 14, par: 4, yardage: 395, handicap: 2 }, { hole: 15, par: 4, yardage: 340, handicap: 14 },
          { hole: 16, par: 3, yardage: 180, handicap: 16 }, { hole: 17, par: 5, yardage: 520, handicap: 8 },
          { hole: 18, par: 4, yardage: 370, handicap: 12 },
        ],
      },
      "McCabe Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 340, handicap: 7 }, { hole: 2, par: 3, yardage: 150, handicap: 15 },
          { hole: 3, par: 4, yardage: 365, handicap: 3 }, { hole: 4, par: 5, yardage: 490, handicap: 5 },
          { hole: 5, par: 4, yardage: 355, handicap: 9 }, { hole: 6, par: 3, yardage: 165, handicap: 17 },
          { hole: 7, par: 4, yardage: 380, handicap: 1 }, { hole: 8, par: 4, yardage: 330, handicap: 13 },
          { hole: 9, par: 5, yardage: 475, handicap: 11 },
          { hole: 10, par: 4, yardage: 350, handicap: 6 }, { hole: 11, par: 4, yardage: 370, handicap: 2 },
          { hole: 12, par: 3, yardage: 145, handicap: 18 }, { hole: 13, par: 5, yardage: 485, handicap: 8 },
          { hole: 14, par: 4, yardage: 360, handicap: 4 }, { hole: 15, par: 4, yardage: 335, handicap: 14 },
          { hole: 16, par: 3, yardage: 170, handicap: 16 }, { hole: 17, par: 4, yardage: 345, handicap: 10 },
          { hole: 18, par: 4, yardage: 375, handicap: 12 },
        ],
      },
      "Greystone Golf Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 390, handicap: 5 }, { hole: 2, par: 5, yardage: 530, handicap: 3 },
          { hole: 3, par: 3, yardage: 178, handicap: 15 }, { hole: 4, par: 4, yardage: 405, handicap: 1 },
          { hole: 5, par: 4, yardage: 370, handicap: 9 }, { hole: 6, par: 3, yardage: 165, handicap: 17 },
          { hole: 7, par: 5, yardage: 545, handicap: 7 }, { hole: 8, par: 4, yardage: 385, handicap: 11 },
          { hole: 9, par: 4, yardage: 360, handicap: 13 },
          { hole: 10, par: 4, yardage: 400, handicap: 4 }, { hole: 11, par: 3, yardage: 185, handicap: 16 },
          { hole: 12, par: 5, yardage: 540, handicap: 2 }, { hole: 13, par: 4, yardage: 375, handicap: 10 },
          { hole: 14, par: 4, yardage: 415, handicap: 6 }, { hole: 15, par: 3, yardage: 172, handicap: 18 },
          { hole: 16, par: 4, yardage: 388, handicap: 8 }, { hole: 17, par: 5, yardage: 520, handicap: 12 },
          { hole: 18, par: 4, yardage: 395, handicap: 14 },
        ],
      },
      "Old Fort Golf Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 365, handicap: 7 }, { hole: 2, par: 4, yardage: 385, handicap: 3 },
          { hole: 3, par: 3, yardage: 155, handicap: 15 }, { hole: 4, par: 5, yardage: 505, handicap: 5 },
          { hole: 5, par: 4, yardage: 370, handicap: 9 }, { hole: 6, par: 3, yardage: 170, handicap: 17 },
          { hole: 7, par: 4, yardage: 395, handicap: 1 }, { hole: 8, par: 5, yardage: 520, handicap: 11 },
          { hole: 9, par: 4, yardage: 345, handicap: 13 },
          { hole: 10, par: 4, yardage: 380, handicap: 4 }, { hole: 11, par: 5, yardage: 515, handicap: 6 },
          { hole: 12, par: 3, yardage: 162, handicap: 18 }, { hole: 13, par: 4, yardage: 390, handicap: 2 },
          { hole: 14, par: 4, yardage: 355, handicap: 12 }, { hole: 15, par: 3, yardage: 180, handicap: 16 },
          { hole: 16, par: 4, yardage: 400, handicap: 8 }, { hole: 17, par: 5, yardage: 495, handicap: 10 },
          { hole: 18, par: 4, yardage: 375, handicap: 14 },
        ],
      },
      "Indian Hills Golf Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 360, handicap: 9 }, { hole: 2, par: 5, yardage: 500, handicap: 5 },
          { hole: 3, par: 3, yardage: 155, handicap: 17 }, { hole: 4, par: 4, yardage: 385, handicap: 3 },
          { hole: 5, par: 4, yardage: 370, handicap: 7 }, { hole: 6, par: 3, yardage: 168, handicap: 15 },
          { hole: 7, par: 4, yardage: 350, handicap: 13 }, { hole: 8, par: 5, yardage: 510, handicap: 1 },
          { hole: 9, par: 4, yardage: 375, handicap: 11 },
          { hole: 10, par: 4, yardage: 388, handicap: 4 }, { hole: 11, par: 4, yardage: 365, handicap: 8 },
          { hole: 12, par: 3, yardage: 160, handicap: 18 }, { hole: 13, par: 5, yardage: 505, handicap: 2 },
          { hole: 14, par: 4, yardage: 380, handicap: 6 }, { hole: 15, par: 4, yardage: 345, handicap: 14 },
          { hole: 16, par: 3, yardage: 175, handicap: 16 }, { hole: 17, par: 5, yardage: 490, handicap: 10 },
          { hole: 18, par: 4, yardage: 355, handicap: 12 },
        ],
      },
      "Twelve Stones Crossing Golf Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 380, handicap: 5 }, { hole: 2, par: 4, yardage: 400, handicap: 3 },
          { hole: 3, par: 3, yardage: 172, handicap: 15 }, { hole: 4, par: 5, yardage: 535, handicap: 7 },
          { hole: 5, par: 4, yardage: 395, handicap: 1 }, { hole: 6, par: 3, yardage: 185, handicap: 17 },
          { hole: 7, par: 4, yardage: 365, handicap: 11 }, { hole: 8, par: 5, yardage: 540, handicap: 9 },
          { hole: 9, par: 4, yardage: 388, handicap: 13 },
          { hole: 10, par: 4, yardage: 405, handicap: 2 }, { hole: 11, par: 3, yardage: 190, handicap: 16 },
          { hole: 12, par: 5, yardage: 550, handicap: 4 }, { hole: 13, par: 4, yardage: 378, handicap: 10 },
          { hole: 14, par: 4, yardage: 415, handicap: 6 }, { hole: 15, par: 3, yardage: 165, handicap: 18 },
          { hole: 16, par: 4, yardage: 390, handicap: 8 }, { hole: 17, par: 5, yardage: 525, handicap: 12 },
          { hole: 18, par: 4, yardage: 385, handicap: 14 },
        ],
      },
      "Windtree Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 365, handicap: 7 }, { hole: 2, par: 5, yardage: 510, handicap: 3 },
          { hole: 3, par: 3, yardage: 158, handicap: 17 }, { hole: 4, par: 4, yardage: 395, handicap: 1 },
          { hole: 5, par: 4, yardage: 375, handicap: 9 }, { hole: 6, par: 3, yardage: 170, handicap: 15 },
          { hole: 7, par: 4, yardage: 355, handicap: 11 }, { hole: 8, par: 5, yardage: 500, handicap: 5 },
          { hole: 9, par: 4, yardage: 380, handicap: 13 },
          { hole: 10, par: 4, yardage: 390, handicap: 4 }, { hole: 11, par: 4, yardage: 370, handicap: 8 },
          { hole: 12, par: 3, yardage: 165, handicap: 18 }, { hole: 13, par: 5, yardage: 515, handicap: 2 },
          { hole: 14, par: 4, yardage: 385, handicap: 6 }, { hole: 15, par: 4, yardage: 350, handicap: 14 },
          { hole: 16, par: 3, yardage: 178, handicap: 16 }, { hole: 17, par: 5, yardage: 495, handicap: 10 },
          { hole: 18, par: 4, yardage: 368, handicap: 12 },
        ],
      },
      "Pine Creek Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 358, handicap: 9 }, { hole: 2, par: 4, yardage: 382, handicap: 5 },
          { hole: 3, par: 3, yardage: 152, handicap: 17 }, { hole: 4, par: 5, yardage: 495, handicap: 3 },
          { hole: 5, par: 4, yardage: 370, handicap: 7 }, { hole: 6, par: 3, yardage: 162, handicap: 15 },
          { hole: 7, par: 4, yardage: 345, handicap: 13 }, { hole: 8, par: 5, yardage: 505, handicap: 1 },
          { hole: 9, par: 4, yardage: 368, handicap: 11 },
          { hole: 10, par: 4, yardage: 375, handicap: 4 }, { hole: 11, par: 5, yardage: 490, handicap: 8 },
          { hole: 12, par: 3, yardage: 148, handicap: 18 }, { hole: 13, par: 4, yardage: 385, handicap: 2 },
          { hole: 14, par: 4, yardage: 355, handicap: 10 }, { hole: 15, par: 3, yardage: 172, handicap: 16 },
          { hole: 16, par: 4, yardage: 360, handicap: 6 }, { hole: 17, par: 5, yardage: 480, handicap: 12 },
          { hole: 18, par: 4, yardage: 365, handicap: 14 },
        ],
      },
      "Eagles Landing Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 370, handicap: 7 }, { hole: 2, par: 5, yardage: 515, handicap: 3 },
          { hole: 3, par: 3, yardage: 160, handicap: 15 }, { hole: 4, par: 4, yardage: 395, handicap: 1 },
          { hole: 5, par: 4, yardage: 380, handicap: 9 }, { hole: 6, par: 3, yardage: 175, handicap: 17 },
          { hole: 7, par: 4, yardage: 355, handicap: 11 }, { hole: 8, par: 5, yardage: 525, handicap: 5 },
          { hole: 9, par: 4, yardage: 385, handicap: 13 },
          { hole: 10, par: 4, yardage: 400, handicap: 2 }, { hole: 11, par: 3, yardage: 185, handicap: 16 },
          { hole: 12, par: 5, yardage: 530, handicap: 4 }, { hole: 13, par: 4, yardage: 375, handicap: 8 },
          { hole: 14, par: 4, yardage: 405, handicap: 6 }, { hole: 15, par: 3, yardage: 168, handicap: 18 },
          { hole: 16, par: 4, yardage: 388, handicap: 10 }, { hole: 17, par: 5, yardage: 510, handicap: 12 },
          { hole: 18, par: 4, yardage: 378, handicap: 14 },
        ],
      },
      "Long Hollow Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 375, handicap: 5 }, { hole: 2, par: 4, yardage: 390, handicap: 3 },
          { hole: 3, par: 3, yardage: 165, handicap: 17 }, { hole: 4, par: 5, yardage: 520, handicap: 7 },
          { hole: 5, par: 4, yardage: 385, handicap: 1 }, { hole: 6, par: 3, yardage: 178, handicap: 15 },
          { hole: 7, par: 4, yardage: 360, handicap: 11 }, { hole: 8, par: 5, yardage: 505, handicap: 9 },
          { hole: 9, par: 4, yardage: 370, handicap: 13 },
          { hole: 10, par: 4, yardage: 395, handicap: 4 }, { hole: 11, par: 5, yardage: 530, handicap: 2 },
          { hole: 12, par: 3, yardage: 158, handicap: 18 }, { hole: 13, par: 4, yardage: 380, handicap: 8 },
          { hole: 14, par: 4, yardage: 405, handicap: 6 }, { hole: 15, par: 3, yardage: 170, handicap: 16 },
          { hole: 16, par: 4, yardage: 365, handicap: 10 }, { hole: 17, par: 5, yardage: 500, handicap: 12 },
          { hole: 18, par: 4, yardage: 382, handicap: 14 },
        ],
      },
      "Ted Rhodes Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 345, handicap: 9 }, { hole: 2, par: 5, yardage: 485, handicap: 5 },
          { hole: 3, par: 3, yardage: 148, handicap: 17 }, { hole: 4, par: 4, yardage: 370, handicap: 3 },
          { hole: 5, par: 4, yardage: 355, handicap: 7 }, { hole: 6, par: 3, yardage: 160, handicap: 15 },
          { hole: 7, par: 4, yardage: 340, handicap: 13 }, { hole: 8, par: 5, yardage: 470, handicap: 1 },
          { hole: 9, par: 4, yardage: 360, handicap: 11 },
          { hole: 10, par: 4, yardage: 365, handicap: 4 }, { hole: 11, par: 4, yardage: 350, handicap: 8 },
          { hole: 12, par: 3, yardage: 145, handicap: 18 }, { hole: 13, par: 5, yardage: 480, handicap: 2 },
          { hole: 14, par: 4, yardage: 375, handicap: 6 }, { hole: 15, par: 4, yardage: 335, handicap: 14 },
          { hole: 16, par: 3, yardage: 165, handicap: 16 }, { hole: 17, par: 4, yardage: 340, handicap: 10 },
          { hole: 18, par: 4, yardage: 358, handicap: 12 },
        ],
      },
      "Stones River Country Club": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 385, handicap: 5 }, { hole: 2, par: 4, yardage: 405, handicap: 1 },
          { hole: 3, par: 3, yardage: 175, handicap: 15 }, { hole: 4, par: 5, yardage: 535, handicap: 3 },
          { hole: 5, par: 4, yardage: 390, handicap: 9 }, { hole: 6, par: 3, yardage: 185, handicap: 17 },
          { hole: 7, par: 4, yardage: 375, handicap: 11 }, { hole: 8, par: 5, yardage: 540, handicap: 7 },
          { hole: 9, par: 4, yardage: 370, handicap: 13 },
          { hole: 10, par: 4, yardage: 400, handicap: 2 }, { hole: 11, par: 3, yardage: 180, handicap: 16 },
          { hole: 12, par: 5, yardage: 545, handicap: 4 }, { hole: 13, par: 4, yardage: 382, handicap: 8 },
          { hole: 14, par: 4, yardage: 415, handicap: 6 }, { hole: 15, par: 3, yardage: 170, handicap: 18 },
          { hole: 16, par: 4, yardage: 395, handicap: 10 }, { hole: 17, par: 5, yardage: 525, handicap: 12 },
          { hole: 18, par: 4, yardage: 388, handicap: 14 },
        ],
      },
      "Shepherds Crook Golf Course": {
        tees: "White",
        holes: [
          { hole: 1, par: 4, yardage: 370, handicap: 7 }, { hole: 2, par: 5, yardage: 508, handicap: 3 },
          { hole: 3, par: 3, yardage: 155, handicap: 15 }, { hole: 4, par: 4, yardage: 388, handicap: 1 },
          { hole: 5, par: 4, yardage: 365, handicap: 9 }, { hole: 6, par: 3, yardage: 170, handicap: 17 },
          { hole: 7, par: 4, yardage: 350, handicap: 11 }, { hole: 8, par: 5, yardage: 510, handicap: 5 },
          { hole: 9, par: 4, yardage: 378, handicap: 13 },
          { hole: 10, par: 4, yardage: 392, handicap: 4 }, { hole: 11, par: 4, yardage: 375, handicap: 6 },
          { hole: 12, par: 3, yardage: 162, handicap: 18 }, { hole: 13, par: 5, yardage: 515, handicap: 2 },
          { hole: 14, par: 4, yardage: 385, handicap: 8 }, { hole: 15, par: 4, yardage: 348, handicap: 14 },
          { hole: 16, par: 3, yardage: 175, handicap: 16 }, { hole: 17, par: 5, yardage: 495, handicap: 10 },
          { hole: 18, par: 4, yardage: 368, handicap: 12 },
        ],
      },
    };

    const allCourses = await storage.getCourses();
    let updated = 0;
    for (const course of allCourses) {
      const holeData = tnHoleData[course.name];
      if (holeData) {
        await storage.updateCourse(course.id, { holeData } as any);
        updated++;
      }
    }
    res.json({ message: `Seeded hole data for ${updated} courses` });
  });

  app.post("/api/trustvault/webhook", async (req: Request, res: Response) => {
    const appId = req.headers["x-app-id"] as string;
    const appName = req.headers["x-app-name"] as string;
    if (appId !== "dw_app_trustvault" || appName !== "Trust Vault") {
      return res.status(403).json({ error: "Invalid webhook source" });
    }
    const { event, projectId, status, downloadUrl, error: renderError } = req.body;
    console.log(`[TrustVault Webhook] ${event} — project ${projectId}, status: ${status}`);
    if (event === "render.complete" && downloadUrl) {
      console.log(`[TrustVault] Render complete, download: ${downloadUrl}`);
    }
    if (event === "render.failed" && renderError) {
      console.error(`[TrustVault] Render failed: ${renderError}`);
    }
    res.json({ received: true });
  });

  app.get("/api/trustvault/capabilities", async (_req: Request, res: Response) => {
    try {
      const caps = await trustvault.getTrustVaultCapabilities();
      res.json(caps);
    } catch (err: any) {
      res.status(502).json({ error: "TrustVault unavailable", details: err.message });
    }
  });

  app.get("/api/trustvault/status", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    try {
      const status = await trustvault.getTrustVaultStatus(token);
      res.json(status);
    } catch (err: any) {
      res.status(502).json({ error: "TrustVault connection failed", details: err.message });
    }
  });

  app.get("/api/trustvault/media", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });
    try {
      const media = await trustvault.listMedia(token, {
        category: req.query.category as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(media);
    } catch (err: any) {
      res.status(502).json({ error: "Failed to list media", details: err.message });
    }
  });

  app.post("/api/trustvault/upload-url", async (req: Request, res: Response) => {
    const { name, contentType, size } = req.body;
    try {
      const result = await trustvault.ecosystemUpload(name, contentType, size);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: "Failed to get upload URL", details: err.message });
    }
  });

  app.post("/api/trustvault/confirm-upload", async (req: Request, res: Response) => {
    try {
      const result = await trustvault.ecosystemConfirmUpload(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: "Failed to confirm upload", details: err.message });
    }
  });

  app.post("/api/trustvault/editor-embed", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    const { editorType, mediaId, returnUrl } = req.body;
    try {
      const result = await trustvault.getEditorEmbed(token, editorType, mediaId, returnUrl);
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ error: "Failed to get editor embed", details: err.message });
    }
  });

  app.get("/api/trustvault/ecosystem-status", async (_req: Request, res: Response) => {
    try {
      const status = await trustvault.ecosystemStatus();
      res.json(status);
    } catch (err: any) {
      res.status(502).json({ error: "TrustVault ecosystem connection failed", details: err.message });
    }
  });

  app.get("/api/trustvault/ecosystem-media", async (req: Request, res: Response) => {
    try {
      const media = await trustvault.ecosystemListMedia({
        category: req.query.category as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      res.json(media);
    } catch (err: any) {
      res.status(502).json({ error: "Failed to list ecosystem media", details: err.message });
    }
  });

  app.post("/api/seed", async (_req: Request, res: Response) => {
    const existingCourses = await storage.getCourses();
    const existingNames = new Set(existingCourses.map((c: any) => c.name));

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
        imageUrl: "/course-images/golf_courses_1.jpg",
        galleryImages: ["/course-images/golf_aerial_1.jpg","/course-images/golf_green_1.jpg","/course-images/golf_morning_1.jpg"],
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
        imageUrl: "/course-images/golf_links_1.jpg",
        galleryImages: ["/course-images/golf_aerial_2.jpg","/course-images/golf_courses_2.jpg","/course-images/golf_green_2.jpg"],
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
        imageUrl: "/course-images/golf_courses_3.jpg",
        galleryImages: ["/course-images/golf_club_1.jpg","/course-images/golf_aerial_3.jpg"],
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
        imageUrl: "/course-images/golf_morning_2.jpg",
        galleryImages: ["/course-images/golf_courses_4.jpg","/course-images/golf_green_3.jpg"],
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
        imageUrl: "/course-images/golf_aerial_4.jpg",
        galleryImages: ["/course-images/golf_courses_5.jpg","/course-images/golf_club_2.jpg"],
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
        imageUrl: "/course-images/golf_green_4.jpg",
        galleryImages: ["/course-images/golf_courses_6.jpg","/course-images/golf_morning_3.jpg"],
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
        imageUrl: "/course-images/golf_links_2.jpg",
        galleryImages: ["/course-images/golf_aerial_5.jpg","/course-images/golf_courses_7.jpg"],
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
        imageUrl: "/course-images/golf_club_3.jpg",
        galleryImages: ["/course-images/golf_links_3.jpg","/course-images/golf_aerial_6.jpg"],
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
        imageUrl: "/course-images/golf_courses_8.jpg",
        galleryImages: ["/course-images/golf_links_4.jpg","/course-images/golf_green_5.jpg"],
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
        imageUrl: "/course-images/golf_morning_4.jpg",
        galleryImages: ["/course-images/golf_club_4.jpg","/course-images/golf_courses_9.jpg"],
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
        imageUrl: "/course-images/golf_links_5.jpg",
        galleryImages: ["/course-images/golf_morning_5.jpg","/course-images/golf_green_6.jpg"],
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
        imageUrl: "/course-images/golf_aerial_7.jpg",
        galleryImages: ["/course-images/golf_links_6.jpg","/course-images/golf_courses_10.jpg"],
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
        imageUrl: "/course-images/golf_green_7.jpg",
        galleryImages: ["/course-images/golf_morning_6.jpg","/course-images/golf_aerial_8.jpg"],
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
        imageUrl: "/course-images/golf_club_5.jpg",
        galleryImages: ["/course-images/golf_green_8.jpg","/course-images/golf_links_7.jpg"],
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
        imageUrl: "/course-images/golf_morning_7.jpg",
        galleryImages: ["/course-images/golf_club_6.jpg","/course-images/golf_aerial_9.jpg"],
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
        imageUrl: "/course-images/golf_links_8.jpg",
        galleryImages: ["/course-images/golf_morning_8.jpg","/course-images/golf_green_9.jpg"],
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
        imageUrl: "/course-images/golf_aerial_10.jpg",
        galleryImages: ["/course-images/golf_club_7.jpg","/course-images/golf_links_9.jpg"],
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
        imageUrl: "/course-images/golf_green_10.jpg",
        galleryImages: ["/course-images/golf_morning_9.jpg","/course-images/golf_club_8.jpg"],
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
        imageUrl: "/course-images/golf_club_9.jpg",
        galleryImages: ["/course-images/golf_green_1.jpg","/course-images/golf_links_10.jpg"],
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
        imageUrl: "/course-images/golf_morning_10.jpg",
        galleryImages: ["/course-images/golf_club_10.jpg","/course-images/golf_aerial_1.jpg"],
      },
      {
        name: "Boscobel Golf Club",
        location: "100 Boscobel Dr",
        city: "Pendleton",
        state: "SC",
        holes: 18,
        par: 71,
        rating: 4.2,
        slope: 128,
        yardage: 6434,
        greenFee: 38,
        courseType: "Public",
        designer: "Russell Breeden",
        yearBuilt: 1968,
        description: "A beloved Upstate layout just minutes from Clemson and Anderson, Boscobel plays through the rolling countryside of historic Pendleton — one of America's oldest inland towns. The course offers a classic Southern golf experience: tree-lined fairways, moderately undulating greens, and peaceful views of pastureland and distant Blue Ridge foothills.",
        amenities: "Pro Shop, Snack Bar, Practice Range, Putting Green, Cart Service, Club Rentals",
        phone: "(864) 646-3991",
        website: "https://www.boscobelgolf.com",
        imageUrl: "/course-images/golf_courses_2.jpg",
        galleryImages: ["/course-images/golf_morning_1.jpg","/course-images/golf_club_1.jpg"],
      },
      {
        name: "Cherokee Valley Golf Club",
        location: "450 Cherokee Valley Way",
        city: "Travelers Rest",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.3,
        slope: 130,
        yardage: 6678,
        greenFee: 45,
        courseType: "Semi-Private",
        designer: "P.B. Dye",
        yearBuilt: 1988,
        description: "Nestled in the Blue Ridge foothills north of Greenville, Cherokee Valley features dramatic elevation changes, mountain views, and P.B. Dye's trademark creative bunkering. A hidden gem with challenging but fair layout.",
        amenities: "Pro Shop, Restaurant, Practice Range, Pool, Tennis",
        phone: "(864) 834-0400",
        website: "https://www.cherokeevalley.com",
        imageUrl: "/course-images/golf_aerial_2.jpg",
        galleryImages: ["/course-images/golf_green_2.jpg"],
      },
      {
        name: "Cobb's Glen Country Club",
        location: "200 Cobbs Glen Dr",
        city: "Anderson",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.1,
        slope: 132,
        yardage: 6900,
        greenFee: 42,
        courseType: "Semi-Private",
        designer: "George Cobb",
        yearBuilt: 1974,
        description: "George Cobb designed this Anderson-area gem with generous fairways but well-defended greens. The course winds through mature hardwoods with several holes playing along beautiful lake shorelines.",
        amenities: "Pro Shop, Restaurant, Pool, Practice Range, Banquet Facilities",
        phone: "(864) 226-7688",
        website: "https://www.cobbsglen.com",
        imageUrl: "/course-images/golf_club_2.jpg",
        galleryImages: ["/course-images/golf_links_1.jpg"],
      },
      {
        name: "Furman University Golf Course",
        location: "3300 Poinsett Hwy",
        city: "Greenville",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.4,
        slope: 131,
        yardage: 6832,
        greenFee: 55,
        courseType: "Public",
        designer: "Robert Trent Jones Sr.",
        yearBuilt: 1958,
        description: "Widely regarded as one of the finest university courses in the South. Robert Trent Jones Sr. created a championship layout that hosted NCAA events and remains a favorite of Greenville-area golfers.",
        amenities: "Pro Shop, Restaurant, Practice Range, Putting Green",
        phone: "(864) 294-2060",
        website: "https://www.furmangolf.com",
        imageUrl: "/course-images/golf_links_3.jpg",
        galleryImages: ["/course-images/golf_aerial_3.jpg"],
      },
      {
        name: "Smithfields Country Club",
        location: "101 Smithfields Dr",
        city: "Easley",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.2,
        slope: 127,
        yardage: 6505,
        greenFee: 35,
        courseType: "Semi-Private",
        designer: "Tom Jackson",
        yearBuilt: 1972,
        description: "A friendly, well-maintained layout in the foothills near Easley. Tom Jackson designed this walkable course with strategic water features and tree-lined fairways that reward shot placement over raw power.",
        amenities: "Pro Shop, Snack Bar, Practice Range, Pool, Tennis",
        phone: "(864) 859-9231",
        website: "https://www.smithfieldscountryclub.com",
        imageUrl: "/course-images/golf_morning_3.jpg",
        galleryImages: ["/course-images/golf_courses_4.jpg"],
      },
      {
        name: "Southern Oaks Golf Club",
        location: "105 Southern Oaks Dr",
        city: "Easley",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.0,
        slope: 124,
        yardage: 6300,
        greenFee: 32,
        courseType: "Public",
        designer: "Tom Jackson",
        yearBuilt: 1990,
        description: "An affordable, well-conditioned public course in Easley. The layout features rolling terrain, mature hardwoods, and several risk-reward par 5s. Popular with local leagues and a great value play.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service",
        phone: "(864) 859-6698",
        imageUrl: "/course-images/golf_green_3.jpg",
        galleryImages: ["/course-images/golf_club_3.jpg"],
      },
      {
        name: "The Preserve at Verdae",
        location: "650 Verdae Blvd",
        city: "Greenville",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.5,
        slope: 135,
        yardage: 6781,
        greenFee: 65,
        courseType: "Public",
        designer: "Willard Byrd",
        yearBuilt: 2001,
        description: "Greenville's premier public course, The Preserve at Verdae winds through protected wetlands and hardwood forest. The Audubon-certified layout features dramatic elevation changes and pristine conditioning year-round.",
        amenities: "Pro Shop, Restaurant, Practice Range, Putting Green, Banquet Facility",
        phone: "(864) 676-1500",
        website: "https://www.verdae.com",
        imageUrl: "/course-images/golf_courses_5.jpg",
        galleryImages: ["/course-images/golf_links_4.jpg"],
      },
      {
        name: "The Walker Course at Clemson University",
        location: "690 Old Greenville Hwy",
        city: "Clemson",
        state: "SC",
        holes: 18,
        par: 72,
        rating: 4.4,
        slope: 134,
        yardage: 6911,
        greenFee: 55,
        courseType: "Public",
        designer: "D.J. DeVictor",
        yearBuilt: 2009,
        description: "Home to the Clemson Tigers golf program, The Walker Course is one of the finest university courses in America. Set against the backdrop of the Blue Ridge Mountains with views of Lake Hartwell.",
        amenities: "Pro Shop, Restaurant, Practice Facility, Clemson Tiger Paw Bunker",
        phone: "(864) 656-0236",
        website: "https://www.clemsontigergolf.com",
        imageUrl: "/course-images/golf_aerial_5.jpg",
        galleryImages: ["/course-images/golf_green_4.jpg"],
      },
      {
        name: "Eagles Landing Golf Course",
        location: "1556 TN-109",
        city: "Gallatin",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.0,
        slope: 125,
        yardage: 6445,
        greenFee: 35,
        courseType: "Public",
        designer: "Local Design",
        yearBuilt: 1989,
        description: "A friendly Sumner County public course in Gallatin with rolling terrain, mature trees, and affordable green fees. Popular with local leagues and weekend players.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service",
        phone: "(615) 230-4653",
        imageUrl: "/course-images/golf_morning_4.jpg",
        galleryImages: ["/course-images/golf_courses_6.jpg"],
      },
      {
        name: "Gaylord Springs Golf Links",
        location: "18 Springhouse Ln",
        city: "Nashville",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.5,
        slope: 137,
        yardage: 6842,
        greenFee: 89,
        courseType: "Resort",
        designer: "Larry Nelson",
        yearBuilt: 1990,
        description: "Nashville's premier links-style course along the Cumberland River. Designed by PGA legend Larry Nelson, Gaylord Springs features island-green par 3s, strategic water hazards, and stunning river views.",
        amenities: "Pro Shop, Restaurant, Practice Range, Resort Access, Banquet Facilities",
        phone: "(615) 458-1730",
        website: "https://www.gaylordsprings.com",
        imageUrl: "/course-images/golf_links_5.jpg",
        galleryImages: ["/course-images/golf_aerial_6.jpg"],
      },
      {
        name: "Greystone Golf Club",
        location: "2555 Greystone Way",
        city: "Dickson",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.2,
        slope: 130,
        yardage: 6680,
        greenFee: 45,
        courseType: "Public",
        designer: "Mark McCumber",
        yearBuilt: 1999,
        description: "West of Nashville in Dickson, Greystone winds through scenic Tennessee countryside with rolling hills, creek crossings, and well-bunkered greens. Mark McCumber's design offers a championship experience at public-course prices.",
        amenities: "Pro Shop, Restaurant, Practice Range, Putting Green",
        phone: "(615) 446-0044",
        website: "https://www.greystonegolf.com",
        imageUrl: "/course-images/golf_courses_7.jpg",
        galleryImages: ["/course-images/golf_green_5.jpg"],
      },
      {
        name: "Harpeth Hills Golf Course",
        location: "2424 Old Hickory Blvd",
        city: "Nashville",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.1,
        slope: 128,
        yardage: 6550,
        greenFee: 32,
        courseType: "Municipal",
        designer: "Benjamin Wilder",
        yearBuilt: 1965,
        description: "Nashville's busiest municipal course, set in Percy Warner Park with dramatic hilltop views of the city skyline. A favorite of Nashville golfers for decades.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service, Club Rentals",
        phone: "(615) 862-8493",
        imageUrl: "/course-images/golf_club_5.jpg",
        galleryImages: ["/course-images/golf_morning_5.jpg"],
      },
      {
        name: "Hermitage Golf Course - General's Retreat",
        location: "3939 Old Hickory Blvd",
        city: "Old Hickory",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.5,
        slope: 138,
        yardage: 6770,
        greenFee: 79,
        courseType: "Public",
        designer: "Denis Griffiths",
        yearBuilt: 1986,
        description: "One of Nashville's top public courses, the General's Retreat at Hermitage has hosted LPGA and Korn Ferry Tour events. The championship layout along the Cumberland River features risk-reward holes and pristine conditioning.",
        amenities: "Pro Shop, Restaurant, Practice Range, Short Game Area, Banquet Facilities",
        phone: "(615) 847-4001",
        website: "https://www.hermitagegolf.com",
        imageUrl: "/course-images/golf_green_6.jpg",
        galleryImages: ["/course-images/golf_club_6.jpg"],
      },
      {
        name: "Hermitage Golf Course - President's Reserve",
        location: "3939 Old Hickory Blvd",
        city: "Old Hickory",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.4,
        slope: 135,
        yardage: 6700,
        greenFee: 69,
        courseType: "Public",
        designer: "Denis Griffiths",
        yearBuilt: 2000,
        description: "The newer of Hermitage Golf Course's two 18-hole layouts. The President's Reserve offers a more open, links-influenced design with generous fairways and creative greenside bunkering.",
        amenities: "Pro Shop, Restaurant, Practice Range, Short Game Area",
        phone: "(615) 847-4001",
        website: "https://www.hermitagegolf.com",
        imageUrl: "/course-images/golf_aerial_7.jpg",
        galleryImages: ["/course-images/golf_links_6.jpg"],
      },
      {
        name: "Indian Hills Golf Club",
        location: "405 Clearview Dr",
        city: "Murfreesboro",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.0,
        slope: 126,
        yardage: 6350,
        greenFee: 30,
        courseType: "Public",
        designer: "Press Maxwell",
        yearBuilt: 1960,
        description: "A Murfreesboro staple since 1960, Indian Hills offers classic Tennessee golf through mature hardwoods with affordable rates. Great for all skill levels.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service",
        phone: "(615) 893-5514",
        imageUrl: "/course-images/golf_links_7.jpg",
        galleryImages: ["/course-images/golf_courses_8.jpg"],
      },
      {
        name: "Long Hollow Golf Course",
        location: "1080 Long Hollow Pike",
        city: "Gallatin",
        state: "TN",
        holes: 18,
        par: 71,
        rating: 4.1,
        slope: 127,
        yardage: 6302,
        greenFee: 35,
        courseType: "Public",
        designer: "Local Design",
        yearBuilt: 1975,
        description: "A Gallatin favorite winding through limestone ridges and cedar groves. The tight, tree-lined fairways demand accuracy and provide a challenging but enjoyable round.",
        amenities: "Pro Shop, Snack Bar, Practice Range, Cart Service",
        phone: "(615) 451-1820",
        imageUrl: "/course-images/golf_morning_6.jpg",
        galleryImages: ["/course-images/golf_aerial_8.jpg"],
      },
      {
        name: "McCabe Golf Course",
        location: "100 46th Ave N",
        city: "Nashville",
        state: "TN",
        holes: 27,
        par: 72,
        rating: 3.8,
        slope: 120,
        yardage: 6100,
        greenFee: 25,
        courseType: "Municipal",
        designer: "Unknown",
        yearBuilt: 1942,
        description: "Nashville's most accessible municipal course with 27 holes. McCabe is an inclusive community course where generations of Nashville golfers learned the game. Affordable and welcoming to all skill levels.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service, Lessons",
        phone: "(615) 862-8491",
        imageUrl: "/course-images/golf_courses_9.jpg",
        galleryImages: ["/course-images/golf_green_7.jpg"],
      },
      {
        name: "Nashville Golf & Athletic Club",
        location: "2400 Murfreesboro Pike",
        city: "Nashville",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.3,
        slope: 133,
        yardage: 6850,
        greenFee: 55,
        courseType: "Semi-Private",
        designer: "Larry Nelson",
        yearBuilt: 1991,
        description: "Southeast Nashville's premier club. Larry Nelson designed this demanding layout with generous fairways but challenging approach shots and fast greens.",
        amenities: "Pro Shop, Restaurant, Practice Range, Pool, Tennis, Fitness Center",
        phone: "(615) 361-8419",
        website: "https://www.nashvillegolf.com",
        imageUrl: "/course-images/golf_club_7.jpg",
        galleryImages: ["/course-images/golf_morning_7.jpg"],
      },
      {
        name: "Old Fort Golf Club",
        location: "1027 Old Fort Pkwy",
        city: "Murfreesboro",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.2,
        slope: 131,
        yardage: 6811,
        greenFee: 42,
        courseType: "Public",
        designer: "Denis Griffiths",
        yearBuilt: 1999,
        description: "One of Murfreesboro's best public courses, Old Fort is a Griffiths design with a championship feel. Rolling terrain, strategic water hazards, and excellent conditioning make it a Middle Tennessee favorite.",
        amenities: "Pro Shop, Restaurant, Practice Range, Putting Green, Short Game Area",
        phone: "(615) 896-4653",
        website: "https://www.oldfortgolf.com",
        imageUrl: "/course-images/golf_green_8.jpg",
        galleryImages: ["/course-images/golf_links_8.jpg"],
      },
      {
        name: "Pine Creek Golf Course",
        location: "1835 Logue Rd",
        city: "Mount Juliet",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.1,
        slope: 129,
        yardage: 6480,
        greenFee: 38,
        courseType: "Public",
        designer: "Local Design",
        yearBuilt: 1992,
        description: "A Mount Juliet gem winding through rolling hills and mature pines. Pine Creek offers a peaceful, scenic round with well-maintained conditions at an affordable price.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service",
        phone: "(615) 758-1199",
        imageUrl: "/course-images/golf_links_9.jpg",
        galleryImages: ["/course-images/golf_club_8.jpg"],
      },
      {
        name: "Shepherds Crook Golf Course",
        location: "281 Sheep Farm Rd",
        city: "Lebanon",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.0,
        slope: 126,
        yardage: 6410,
        greenFee: 32,
        courseType: "Public",
        designer: "Local Design",
        yearBuilt: 1998,
        description: "A Wilson County favorite with a pastoral setting among rolling farmland east of Nashville. Shepherds Crook delivers a relaxing round with well-maintained greens.",
        amenities: "Pro Shop, Snack Bar, Cart Service, Driving Range",
        phone: "(615) 444-1176",
        imageUrl: "/course-images/golf_aerial_9.jpg",
        galleryImages: ["/course-images/golf_green_9.jpg"],
      },
      {
        name: "Stones River Country Club",
        location: "1830 N Thompson Ln",
        city: "Murfreesboro",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.3,
        slope: 134,
        yardage: 6750,
        greenFee: 60,
        courseType: "Private",
        designer: "Robert Trent Jones Sr.",
        yearBuilt: 1955,
        description: "Murfreesboro's most prestigious private club. Robert Trent Jones Sr. designed this classic layout along the Stones River with elevated greens, strategic bunkering, and a challenging but fair test of golf.",
        amenities: "Pro Shop, Restaurant, Pool, Tennis, Practice Range, Banquet Facilities",
        phone: "(615) 893-3890",
        website: "https://www.stonesrivercc.com",
        imageUrl: "/course-images/golf_club_9.jpg",
        galleryImages: ["/course-images/golf_morning_8.jpg"],
      },
      {
        name: "Ted Rhodes Golf Course",
        location: "1901 Ed Temple Blvd",
        city: "Nashville",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 3.9,
        slope: 122,
        yardage: 6200,
        greenFee: 25,
        courseType: "Municipal",
        designer: "Unknown",
        yearBuilt: 1953,
        description: "Named after Nashville-born golfing pioneer Ted Rhodes, who helped break golf's color barrier. This historic municipal course is one of Nashville's most important cultural landmarks.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service",
        phone: "(615) 862-8463",
        imageUrl: "/course-images/golf_morning_9.jpg",
        galleryImages: ["/course-images/golf_courses_10.jpg"],
      },
      {
        name: "Twelve Stones Crossing Golf Club",
        location: "175 Fairway Dr",
        city: "Goodlettsville",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.2,
        slope: 131,
        yardage: 6700,
        greenFee: 45,
        courseType: "Public",
        designer: "Gary Roger Baird",
        yearBuilt: 2002,
        description: "North of Nashville in Goodlettsville, Twelve Stones Crossing offers a modern championship layout with exceptional conditioning. Stone creek crossings, bentgrass greens, and strategic bunkering throughout.",
        amenities: "Pro Shop, Restaurant, Practice Range, Putting Green, Short Game Area",
        phone: "(615) 855-0099",
        website: "https://www.12stonescrossing.com",
        imageUrl: "/course-images/golf_green_10.jpg",
        galleryImages: ["/course-images/golf_club_10.jpg"],
      },
      {
        name: "Windtree Golf Course",
        location: "1231 Old Lebanon Dirt Rd",
        city: "Mount Juliet",
        state: "TN",
        holes: 18,
        par: 72,
        rating: 4.1,
        slope: 128,
        yardage: 6450,
        greenFee: 38,
        courseType: "Public",
        designer: "Local Design",
        yearBuilt: 1985,
        description: "A Wilson County staple, Windtree is a mature, tree-lined layout in Mount Juliet with well-maintained conditions and affordable rates. A go-to course for local golfers.",
        amenities: "Pro Shop, Snack Bar, Driving Range, Cart Service, Club Rentals",
        phone: "(615) 754-0059",
        imageUrl: "/course-images/golf_links_10.jpg",
        galleryImages: ["/course-images/golf_aerial_10.jpg"],
      },
    ];

    let addedCourses = 0;
    for (const course of sampleCourses) {
      if (!existingNames.has(course.name)) {
        await storage.createCourse(course as any);
        addedCourses++;
      }
    }

    const sampleDeals = [
      { courseName: "Torrey Pines South", title: "Twilight Special", description: "Play the famous Torrey Pines after 2pm at a discounted rate. Cart included.", originalPrice: 202, dealPrice: 129, discountPercent: 36, isHot: true, imageUrl: "/course-images/golf_green_4.jpg" },
      { courseName: "Bethpage Black", title: "Weekday Deal", description: "Monday-Thursday rounds with cart at NY's toughest public course.", originalPrice: 150, dealPrice: 99, discountPercent: 34, isHot: true, imageUrl: "/course-images/golf_aerial_4.jpg" },
      { courseName: "TPC Sawgrass", title: "Stay & Play Package", description: "One night stay plus one round on the Stadium Course. A golfer's dream.", originalPrice: 450, dealPrice: 349, discountPercent: 22, isHot: false, imageUrl: "/course-images/golf_courses_3.jpg" },
      { courseName: "Pinehurst No. 2", title: "Resort Package", description: "Two nights accommodation plus unlimited golf on all eight Pinehurst courses.", originalPrice: 395, dealPrice: 299, discountPercent: 24, isHot: false, imageUrl: "/course-images/golf_morning_2.jpg" },
      { courseName: "Kiawah Island Ocean Course", title: "Early Bird Special", description: "First tee time of the day with complimentary breakfast at the clubhouse.", originalPrice: 423, dealPrice: 329, discountPercent: 22, isHot: true, imageUrl: "/course-images/golf_club_3.jpg" },
    ];

    const allCoursesNow = await storage.getCourses();
    const existingDeals = await storage.getDeals();

    if (existingDeals.length === 0) {
      for (const deal of sampleDeals) {
        const matchedCourse = allCoursesNow.find((c: any) => c.name.includes(deal.courseName) || deal.courseName.includes(c.name));
        await storage.createDeal({ ...deal, courseId: matchedCourse?.id || null } as any);
      }
    } else {
      for (const deal of existingDeals) {
        const seedDeal = sampleDeals.find((sd: any) => sd.courseName === deal.courseName);
        if (seedDeal && deal.imageUrl !== seedDeal.imageUrl) {
          const matchedCourse = allCoursesNow.find((c: any) => c.name.includes(deal.courseName) || deal.courseName.includes(c.name));
          await storage.updateDeal(deal.id, { imageUrl: seedDeal.imageUrl, courseId: matchedCourse?.id || deal.courseId });
        }
      }
    }

    for (const sc of sampleCourses) {
      const existing = allCoursesNow.find((c: any) => c.name === sc.name);
      if (existing && existing.imageUrl !== sc.imageUrl) {
        await storage.updateCourse(existing.id, { imageUrl: sc.imageUrl, galleryImages: sc.galleryImages });
      }
    }

    const totalCourses = allCoursesNow.length;
    res.json({ message: addedCourses > 0 ? `Added ${addedCourses} new courses` : "All courses present", courses: totalCourses, deals: sampleDeals.length });
  });

  const httpServer = createServer(app);
  return httpServer;
}
