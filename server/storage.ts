import { 
  users, courses, rounds, swingAnalyses, deals, conversations, messages,
  type User, type InsertUser, type Course, type InsertCourse, 
  type Round, type InsertRound, type SwingAnalysis, type Deal, type InsertDeal,
  type Conversation, type Message
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getRounds(userId: string): Promise<Round[]>;
  createRound(round: InsertRound): Promise<Round>;
  getSwingAnalyses(userId: string): Promise<SwingAnalysis[]>;
  createSwingAnalysis(analysis: Partial<SwingAnalysis>): Promise<SwingAnalysis>;
  getDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
}

export const storage = new DatabaseStorage();
