import { 
  users, courses, rounds, swingAnalyses, deals, vendorApplications, whitelistedUsers, conversations, messages,
  analyticsSessions, analyticsPageViews, analyticsEvents, blogPosts,
  bomberProfiles, bomberEquipment, bomberLeaderboard, bomberChestQueue, bomberDailyChallenges,
  type User, type InsertUser, type Course, type InsertCourse, 
  type Round, type InsertRound, type SwingAnalysis, type Deal, type InsertDeal,
  type VendorApplication, type InsertVendorApplication,
  type WhitelistedUser, type InsertWhitelistedUser,
  type Conversation, type Message,
  type AnalyticsSession, type AnalyticsPageView, type AnalyticsEvent,
  type BlogPost, type InsertBlogPost,
  type BomberProfile, type BomberEquipmentItem, type BomberLeaderboardEntry, type BomberChest, type BomberDailyChallenge
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, gte, and, count, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getRounds(userId: string): Promise<Round[]>;
  createRound(round: InsertRound): Promise<Round>;
  getSwingAnalyses(userId: string): Promise<SwingAnalysis[]>;
  createSwingAnalysis(analysis: Partial<SwingAnalysis>): Promise<SwingAnalysis>;
  getDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  getVendorApplications(): Promise<VendorApplication[]>;
  getVendorApplication(id: number): Promise<VendorApplication | undefined>;
  createVendorApplication(app: InsertVendorApplication): Promise<VendorApplication>;
  updateVendorApplicationStatus(id: number, status: string, notes?: string): Promise<VendorApplication>;
  createAnalyticsSession(data: Partial<AnalyticsSession>): Promise<AnalyticsSession>;
  endAnalyticsSession(sessionId: string): Promise<void>;
  createPageView(data: Partial<AnalyticsPageView>): Promise<AnalyticsPageView>;
  createAnalyticsEvent(data: Partial<AnalyticsEvent>): Promise<AnalyticsEvent>;
  getAnalyticsSummary(days: number): Promise<any>;
  getRealtimeVisitors(): Promise<number>;
  getTrafficData(days: number): Promise<any[]>;
  getTopPages(days: number): Promise<any[]>;
  getTopReferrers(days: number): Promise<any[]>;
  getDeviceBreakdown(days: number): Promise<any[]>;
  getBrowserBreakdown(days: number): Promise<any[]>;
  getRecentEvents(days: number): Promise<any[]>;
  getBlogPosts(status?: string): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: Partial<BlogPost>): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
  getWhitelistedUsers(): Promise<WhitelistedUser[]>;
  getWhitelistedUser(id: number): Promise<WhitelistedUser | undefined>;
  getWhitelistedUserByNameAndPin(name: string, pin: string): Promise<WhitelistedUser | undefined>;
  createWhitelistedUser(data: InsertWhitelistedUser): Promise<WhitelistedUser>;
  updateWhitelistedUser(id: number, data: Partial<WhitelistedUser>): Promise<WhitelistedUser>;
  deleteWhitelistedUser(id: number): Promise<void>;
  getBomberProfile(userId: string): Promise<BomberProfile | undefined>;
  createBomberProfile(userId: string): Promise<BomberProfile>;
  updateBomberProfile(userId: string, data: Partial<BomberProfile>): Promise<BomberProfile>;
  addBomberLeaderboardEntry(entry: Partial<BomberLeaderboardEntry>): Promise<BomberLeaderboardEntry>;
  getBomberLeaderboard(limit?: number): Promise<BomberLeaderboardEntry[]>;
  getBomberUserBest(userId: string): Promise<BomberLeaderboardEntry | undefined>;
  addBomberEquipment(userId: string, equipmentId: string, type: string): Promise<BomberEquipmentItem>;
  getBomberEquipment(userId: string): Promise<BomberEquipmentItem[]>;
  upgradeBomberEquipment(id: number): Promise<BomberEquipmentItem>;
  addBomberEquipmentDuplicate(userId: string, equipmentId: string, type: string): Promise<BomberEquipmentItem>;
  addBomberChest(userId: string, chestType: string): Promise<BomberChest>;
  getBomberChestQueue(userId: string): Promise<BomberChest[]>;
  openBomberChest(id: number, contents: any): Promise<BomberChest>;
  getDailyChallenge(dateStr: string): Promise<BomberDailyChallenge | undefined>;
  createDailyChallenge(challenge: Partial<BomberDailyChallenge>): Promise<BomberDailyChallenge>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(insertUser as any).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(data as any).where(eq(users.id, id)).returning();
    return updated;
  }

  async getCourses(): Promise<Course[]> {
    return db.select().from(courses).orderBy(desc(courses.rating));
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: number, data: Partial<InsertCourse>): Promise<Course> {
    const [updated] = await db.update(courses).set(data).where(eq(courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return true;
  }

  async getRounds(userId: string): Promise<Round[]> {
    return db.select().from(rounds).where(eq(rounds.userId, userId)).orderBy(desc(rounds.date));
  }

  async createRound(round: InsertRound): Promise<Round> {
    const [newRound] = await db.insert(rounds).values(round).returning();
    return newRound;
  }

  async getSwingAnalyses(userId: string): Promise<SwingAnalysis[]> {
    return db.select().from(swingAnalyses).where(eq(swingAnalyses.userId, userId)).orderBy(desc(swingAnalyses.createdAt));
  }

  async createSwingAnalysis(analysis: Partial<SwingAnalysis>): Promise<SwingAnalysis> {
    const [newAnalysis] = await db.insert(swingAnalyses).values(analysis as any).returning();
    return newAnalysis;
  }

  async getDeals(): Promise<Deal[]> {
    return db.select().from(deals).orderBy(desc(deals.isHot), desc(deals.discountPercent));
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: number, data: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db.update(deals).set(data).where(eq(deals.id, id)).returning();
    return updated;
  }

  async getVendorApplications(): Promise<VendorApplication[]> {
    return db.select().from(vendorApplications).orderBy(desc(vendorApplications.createdAt));
  }

  async getVendorApplication(id: number): Promise<VendorApplication | undefined> {
    const [app] = await db.select().from(vendorApplications).where(eq(vendorApplications.id, id));
    return app || undefined;
  }

  async createVendorApplication(app: InsertVendorApplication): Promise<VendorApplication> {
    const [newApp] = await db.insert(vendorApplications).values(app).returning();
    return newApp;
  }

  async updateVendorApplicationStatus(id: number, status: string, notes?: string): Promise<VendorApplication> {
    const data: any = { status };
    if (notes !== undefined) data.notes = notes;
    const [updated] = await db.update(vendorApplications).set(data).where(eq(vendorApplications.id, id)).returning();
    return updated;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async createConversation(title: string): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values({ title }).returning();
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return message;
  }

  async getBlogPosts(status?: string): Promise<BlogPost[]> {
    if (status) {
      return db.select().from(blogPosts).where(eq(blogPosts.status, status)).orderBy(desc(blogPosts.publishedAt));
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(post: Partial<BlogPost>): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post as any).returning();
    return newPost;
  }

  async updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
    const [updated] = await db.update(blogPosts).set({ ...data, updatedAt: new Date() } as any).where(eq(blogPosts.id, id)).returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async createAnalyticsSession(data: Partial<AnalyticsSession>): Promise<AnalyticsSession> {
    const [session] = await db.insert(analyticsSessions).values(data as any).returning();
    return session;
  }

  async endAnalyticsSession(sessionId: string): Promise<void> {
    await db.update(analyticsSessions)
      .set({ endedAt: new Date() })
      .where(eq(analyticsSessions.sessionId, sessionId));
  }

  async createPageView(data: Partial<AnalyticsPageView>): Promise<AnalyticsPageView> {
    const [pv] = await db.insert(analyticsPageViews).values(data as any).returning();
    return pv;
  }

  async createAnalyticsEvent(data: Partial<AnalyticsEvent>): Promise<AnalyticsEvent> {
    const [event] = await db.insert(analyticsEvents).values(data as any).returning();
    return event;
  }

  async getAnalyticsSummary(days: number): Promise<any> {
    const since = new Date(Date.now() - days * 86400000);
    const [pvCount] = await db.select({ count: count() }).from(analyticsPageViews).where(gte(analyticsPageViews.createdAt, since));
    const [sessionCount] = await db.select({ count: count() }).from(analyticsSessions).where(gte(analyticsSessions.startedAt, since));
    const uniqueVisitors = await db.selectDistinct({ visitorId: analyticsSessions.visitorId }).from(analyticsSessions).where(gte(analyticsSessions.startedAt, since));
    const sessionsWithEnd = await db.select().from(analyticsSessions).where(and(gte(analyticsSessions.startedAt, since), sql`${analyticsSessions.endedAt} IS NOT NULL`));
    const totalDuration = sessionsWithEnd.reduce((sum, s) => {
      if (s.endedAt && s.startedAt) return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime());
      return sum;
    }, 0);
    const avgDuration = sessionsWithEnd.length > 0 ? Math.round(totalDuration / sessionsWithEnd.length / 1000) : 0;
    const singlePageSessions = await db.execute(sql`
      SELECT COUNT(DISTINCT s.session_id) as bounce_count
      FROM analytics_sessions s
      LEFT JOIN analytics_page_views pv ON s.session_id = pv.session_id
      WHERE s.started_at >= ${since}
      GROUP BY s.session_id
      HAVING COUNT(pv.id) <= 1
    `);
    const bounceRate = sessionCount.count > 0 ? Math.round((singlePageSessions.rows.length / sessionCount.count) * 100) : 0;
    return {
      pageViews: pvCount.count,
      sessions: sessionCount.count,
      uniqueVisitors: uniqueVisitors.length,
      avgDuration,
      bounceRate,
    };
  }

  async getRealtimeVisitors(): Promise<number> {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    const active = await db.selectDistinct({ visitorId: analyticsSessions.visitorId })
      .from(analyticsSessions)
      .where(and(
        gte(analyticsSessions.startedAt, fiveMinAgo),
        sql`${analyticsSessions.endedAt} IS NULL`
      ));
    return active.length;
  }

  async getTrafficData(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT DATE(created_at) as date,
        COUNT(*) as page_views,
        COUNT(DISTINCT visitor_id) as visitors
      FROM analytics_page_views
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return result.rows;
  }

  async getTopPages(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT path, COUNT(*) as views
      FROM analytics_page_views
      WHERE created_at >= ${since}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 15
    `);
    return result.rows;
  }

  async getTopReferrers(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT referrer, COUNT(*) as sessions
      FROM analytics_sessions
      WHERE started_at >= ${since} AND referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer
      ORDER BY sessions DESC
      LIMIT 10
    `);
    return result.rows;
  }

  async getDeviceBreakdown(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT device, COUNT(*) as count
      FROM analytics_sessions
      WHERE started_at >= ${since} AND device IS NOT NULL
      GROUP BY device
      ORDER BY count DESC
    `);
    return result.rows;
  }

  async getBrowserBreakdown(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT browser, COUNT(*) as count
      FROM analytics_sessions
      WHERE started_at >= ${since} AND browser IS NOT NULL
      GROUP BY browser
      ORDER BY count DESC
    `);
    return result.rows;
  }

  async getRecentEvents(days: number): Promise<any[]> {
    const since = new Date(Date.now() - days * 86400000);
    const result = await db.execute(sql`
      SELECT event_name, category, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${since}
      GROUP BY event_name, category
      ORDER BY count DESC
      LIMIT 20
    `);
    return result.rows;
  }

  async getWhitelistedUsers(): Promise<WhitelistedUser[]> {
    return db.select().from(whitelistedUsers).orderBy(desc(whitelistedUsers.createdAt));
  }

  async getWhitelistedUser(id: number): Promise<WhitelistedUser | undefined> {
    const [wl] = await db.select().from(whitelistedUsers).where(eq(whitelistedUsers.id, id));
    return wl;
  }

  async getWhitelistedUserByNameAndPin(name: string, pin: string): Promise<WhitelistedUser | undefined> {
    const [wl] = await db.select().from(whitelistedUsers)
      .where(and(
        eq(sql`LOWER(${whitelistedUsers.name})`, name.toLowerCase()),
        eq(whitelistedUsers.pin, pin),
        eq(whitelistedUsers.status, "active")
      ));
    return wl;
  }

  async createWhitelistedUser(data: InsertWhitelistedUser): Promise<WhitelistedUser> {
    const [wl] = await db.insert(whitelistedUsers).values(data).returning();
    return wl;
  }

  async updateWhitelistedUser(id: number, data: Partial<WhitelistedUser>): Promise<WhitelistedUser> {
    const [wl] = await db.update(whitelistedUsers).set(data).where(eq(whitelistedUsers.id, id)).returning();
    return wl;
  }

  async deleteWhitelistedUser(id: number): Promise<void> {
    await db.delete(whitelistedUsers).where(eq(whitelistedUsers.id, id));
  }

  async getBomberProfile(userId: string): Promise<BomberProfile | undefined> {
    const [profile] = await db.select().from(bomberProfiles).where(eq(bomberProfiles.userId, userId));
    return profile || undefined;
  }

  async createBomberProfile(userId: string): Promise<BomberProfile> {
    const [profile] = await db.insert(bomberProfiles).values({ userId } as any).returning();
    return profile;
  }

  async updateBomberProfile(userId: string, data: Partial<BomberProfile>): Promise<BomberProfile> {
    const [updated] = await db.update(bomberProfiles).set(data as any).where(eq(bomberProfiles.userId, userId)).returning();
    return updated;
  }

  async addBomberLeaderboardEntry(entry: Partial<BomberLeaderboardEntry>): Promise<BomberLeaderboardEntry> {
    const [row] = await db.insert(bomberLeaderboard).values(entry as any).returning();
    return row;
  }

  async getBomberLeaderboard(limit = 50): Promise<BomberLeaderboardEntry[]> {
    return db.select().from(bomberLeaderboard).orderBy(desc(bomberLeaderboard.distance)).limit(limit);
  }

  async getBomberUserBest(userId: string): Promise<BomberLeaderboardEntry | undefined> {
    const [entry] = await db.select().from(bomberLeaderboard)
      .where(eq(bomberLeaderboard.userId, userId))
      .orderBy(desc(bomberLeaderboard.distance))
      .limit(1);
    return entry || undefined;
  }

  async addBomberEquipment(userId: string, equipmentId: string, type: string): Promise<BomberEquipmentItem> {
    const [item] = await db.insert(bomberEquipment).values({ userId, equipmentId, type } as any).returning();
    return item;
  }

  async getBomberEquipment(userId: string): Promise<BomberEquipmentItem[]> {
    return db.select().from(bomberEquipment).where(eq(bomberEquipment.userId, userId)).orderBy(bomberEquipment.unlockedAt);
  }

  async upgradeBomberEquipment(id: number): Promise<BomberEquipmentItem> {
    const [updated] = await db.update(bomberEquipment)
      .set({ level: sql`${bomberEquipment.level} + 1`, duplicates: 0 })
      .where(eq(bomberEquipment.id, id))
      .returning();
    return updated;
  }

  async addBomberEquipmentDuplicate(userId: string, equipmentId: string, type: string): Promise<BomberEquipmentItem> {
    const existing = await db.select().from(bomberEquipment)
      .where(and(eq(bomberEquipment.userId, userId), eq(bomberEquipment.equipmentId, equipmentId), eq(bomberEquipment.type, type)));
    if (existing.length > 0) {
      const [updated] = await db.update(bomberEquipment)
        .set({ duplicates: sql`${bomberEquipment.duplicates} + 1` })
        .where(eq(bomberEquipment.id, existing[0].id))
        .returning();
      return updated;
    }
    return this.addBomberEquipment(userId, equipmentId, type);
  }

  async addBomberChest(userId: string, chestType: string): Promise<BomberChest> {
    const [chest] = await db.insert(bomberChestQueue).values({ userId, chestType } as any).returning();
    return chest;
  }

  async getBomberChestQueue(userId: string): Promise<BomberChest[]> {
    return db.select().from(bomberChestQueue)
      .where(and(eq(bomberChestQueue.userId, userId), isNull(bomberChestQueue.openedAt)))
      .orderBy(desc(bomberChestQueue.earnedAt));
  }

  async openBomberChest(id: number, contents: any): Promise<BomberChest> {
    const [chest] = await db.update(bomberChestQueue)
      .set({ openedAt: new Date(), contents })
      .where(eq(bomberChestQueue.id, id))
      .returning();
    return chest;
  }

  async getDailyChallenge(dateStr: string): Promise<BomberDailyChallenge | undefined> {
    const [challenge] = await db.select().from(bomberDailyChallenges)
      .where(eq(bomberDailyChallenges.activeDate, dateStr));
    return challenge || undefined;
  }

  async createDailyChallenge(challenge: Partial<BomberDailyChallenge>): Promise<BomberDailyChallenge> {
    const [row] = await db.insert(bomberDailyChallenges).values(challenge as any).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
