import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, serial, jsonb } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type SwingAnalysis = typeof swingAnalyses.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
