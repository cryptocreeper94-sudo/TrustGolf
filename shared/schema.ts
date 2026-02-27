import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, serial, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  handicap: real("handicap"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  age: integer("age"),
  height: text("height"),
  swingSpeed: integer("swing_speed"),
  avgDriveDistance: integer("avg_drive_distance"),
  flexibilityLevel: text("flexibility_level"),
  golfGoals: text("golf_goals"),
  clubDistances: jsonb("club_distances"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  holes: integer("holes").notNull().default(18),
  par: integer("par").notNull().default(72),
  rating: real("rating").default(4.0),
  slope: integer("slope").default(113),
  yardage: integer("yardage").default(6500),
  greenFee: integer("green_fee").default(50),
  imageUrl: text("image_url"),
  description: text("description"),
  amenities: text("amenities"),
  phone: text("phone"),
  website: text("website"),
  courseType: text("course_type"),
  designer: text("designer"),
  yearBuilt: integer("year_built"),
  galleryImages: jsonb("gallery_images"),
  holeData: jsonb("hole_data"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  courseName: text("course_name").notNull(),
  date: timestamp("date").notNull().default(sql`CURRENT_TIMESTAMP`),
  totalScore: integer("total_score").notNull(),
  par: integer("par").notNull().default(72),
  holes: integer("holes").notNull().default(18),
  scores: jsonb("scores"),
  putts: integer("putts"),
  fairwaysHit: integer("fairways_hit"),
  greensInRegulation: integer("greens_in_regulation"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const swingAnalyses = pgTable("swing_analyses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoUrl: text("video_url"),
  analysisResult: jsonb("analysis_result"),
  overallScore: integer("overall_score"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  courseName: text("course_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  originalPrice: integer("original_price").notNull(),
  dealPrice: integer("deal_price").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  validUntil: timestamp("valid_until"),
  imageUrl: text("image_url"),
  isHot: boolean("is_hot").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const vendorApplications = pgTable("vendor_applications", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  businessType: text("business_type").notNull(),
  message: text("message"),
  partnershipTier: text("partnership_tier").notNull().default("free_listing"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const whitelistedUsers = pgTable("whitelisted_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
  status: text("status").notNull().default("active"),
  linkedUserId: varchar("linked_user_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  rounds: many(rounds),
  swingAnalyses: many(swingAnalyses),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  rounds: many(rounds),
  deals: many(deals),
}));

export const roundsRelations = relations(rounds, ({ one }) => ({
  user: one(users, { fields: [rounds.userId], references: [users.id] }),
  course: one(courses, { fields: [rounds.courseId], references: [courses.id] }),
}));

export const swingAnalysesRelations = relations(swingAnalyses, ({ one }) => ({
  user: one(users, { fields: [swingAnalyses.userId], references: [users.id] }),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  course: one(courses, { fields: [deals.courseId], references: [courses.id] }),
}));

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  category: text("category").notNull().default("general"),
  tags: text("tags"),
  authorName: text("author_name").notNull().default("Trust Golf"),
  status: text("status").notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });

export const analyticsSessions = pgTable("analytics_sessions", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  landingPage: text("landing_page"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  device: text("device"),
  browser: text("browser"),
  country: text("country"),
  startedAt: timestamp("started_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  endedAt: timestamp("ended_at"),
});

export const analyticsPageViews = pgTable("analytics_page_views", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  path: text("path").notNull(),
  title: text("title"),
  referrer: text("referrer"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  sessionId: text("session_id").notNull(),
  eventName: text("event_name").notNull(),
  category: text("category"),
  label: text("label"),
  value: integer("value"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true, createdAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true });
export const insertVendorApplicationSchema = createInsertSchema(vendorApplications).omit({ id: true, createdAt: true, status: true, notes: true });
export const insertWhitelistedUserSchema = createInsertSchema(whitelistedUsers).omit({ id: true, createdAt: true, status: true, linkedUserId: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type SwingAnalysis = typeof swingAnalyses.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type VendorApplication = typeof vendorApplications.$inferSelect;
export type InsertVendorApplication = z.infer<typeof insertVendorApplicationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type WhitelistedUser = typeof whitelistedUsers.$inferSelect;
export type InsertWhitelistedUser = z.infer<typeof insertWhitelistedUserSchema>;

export const bomberProfiles = pgTable("bomber_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(500),
  gems: integer("gems").notNull().default(10),
  totalDrives: integer("total_drives").notNull().default(0),
  bestDistance: integer("best_distance").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastDailyRewardAt: timestamp("last_daily_reward_at"),
  equippedDriver: varchar("equipped_driver").notNull().default("standard"),
  equippedBall: varchar("equipped_ball").notNull().default("standard"),
  division: varchar("division").notNull().default("bronze"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bomberEquipment = pgTable("bomber_equipment", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  equipmentId: varchar("equipment_id").notNull(),
  type: varchar("type").notNull(),
  level: integer("level").notNull().default(1),
  duplicates: integer("duplicates").notNull().default(0),
  unlockedAt: timestamp("unlocked_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bomberLeaderboard = pgTable("bomber_leaderboard", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  username: text("username").notNull(),
  distance: integer("distance").notNull(),
  ballSpeed: integer("ball_speed"),
  launchAngle: real("launch_angle"),
  wind: real("wind"),
  nightMode: boolean("night_mode").default(false),
  equippedDriver: varchar("equipped_driver"),
  equippedBall: varchar("equipped_ball"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const bomberChestQueue = pgTable("bomber_chest_queue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  chestType: varchar("chest_type").notNull(),
  earnedAt: timestamp("earned_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  openedAt: timestamp("opened_at"),
  contents: jsonb("contents"),
});

export const bomberDailyChallenges = pgTable("bomber_daily_challenges", {
  id: serial("id").primaryKey(),
  challengeId: varchar("challenge_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetDistance: integer("target_distance").notNull(),
  condition: varchar("condition").notNull(),
  reward: jsonb("reward").notNull(),
  activeDate: date("active_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBomberProfileSchema = createInsertSchema(bomberProfiles).omit({ id: true, createdAt: true });
export const insertBomberEquipmentSchema = createInsertSchema(bomberEquipment).omit({ id: true, unlockedAt: true });
export const insertBomberLeaderboardSchema = createInsertSchema(bomberLeaderboard).omit({ id: true, createdAt: true });
export const insertBomberChestSchema = createInsertSchema(bomberChestQueue).omit({ id: true, earnedAt: true, openedAt: true, contents: true });

export type BomberProfile = typeof bomberProfiles.$inferSelect;
export type InsertBomberProfile = z.infer<typeof insertBomberProfileSchema>;
export type BomberEquipmentItem = typeof bomberEquipment.$inferSelect;
export type BomberLeaderboardEntry = typeof bomberLeaderboard.$inferSelect;
export type BomberChest = typeof bomberChestQueue.$inferSelect;
export type BomberDailyChallenge = typeof bomberDailyChallenges.$inferSelect;
