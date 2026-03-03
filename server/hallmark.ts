import crypto from "crypto";
import { db } from "./db";
import { hallmarks, trustStamps, hallmarkCounter } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const PREFIX = "TG";
const APP_NAME = "Trust Golf";
const DOMAIN = "trustgolf.tlid.io";

function sha256(payload: object): string {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function simulatedTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function simulatedBlockHeight(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

function formatHallmarkId(seq: number): string {
  return `${PREFIX}-${String(seq).padStart(8, "0")}`;
}

export async function generateHallmark(data: {
  userId?: string;
  appId: string;
  appName: string;
  productName: string;
  releaseType: string;
  metadata?: any;
}): Promise<any> {
  const result = await db.execute(sql`
    INSERT INTO hallmark_counter (id, current_sequence)
    VALUES (${`${PREFIX.toLowerCase()}-master`}, '1')
    ON CONFLICT (id) DO UPDATE
    SET current_sequence = (CAST(hallmark_counter.current_sequence AS INTEGER) + 1)::TEXT
    RETURNING current_sequence
  `);

  const seq = parseInt(result.rows[0].current_sequence as string);
  const thId = formatHallmarkId(seq);
  const timestamp = new Date().toISOString();

  const payload = {
    thId,
    userId: data.userId || null,
    appId: data.appId,
    appName: data.appName,
    productName: data.productName,
    releaseType: data.releaseType,
    metadata: data.metadata || {},
    timestamp,
  };

  const dataHash = sha256(payload);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();
  const verificationUrl = `https://${DOMAIN}/api/hallmark/${thId}/verify`;

  const [hallmark] = await db.insert(hallmarks).values({
    thId,
    userId: data.userId || null,
    appId: data.appId,
    appName: data.appName,
    productName: data.productName,
    releaseType: data.releaseType,
    metadata: data.metadata || {},
    dataHash,
    txHash,
    blockHeight,
    verificationUrl,
    hallmarkId: seq,
  }).returning();

  return hallmark;
}

export async function createTrustStamp(data: {
  userId?: string;
  category: string;
  data: any;
}): Promise<any> {
  const timestamp = new Date().toISOString();
  const payload = {
    ...data.data,
    category: data.category,
    appContext: "trustgolf",
    timestamp,
  };

  const dataHash = sha256(payload);
  const txHash = simulatedTxHash();
  const blockHeight = simulatedBlockHeight();

  const [stamp] = await db.insert(trustStamps).values({
    userId: data.userId || null,
    category: data.category,
    data: payload,
    dataHash,
    txHash,
    blockHeight,
  }).returning();

  return stamp;
}

export async function seedGenesisHallmark(): Promise<void> {
  const existing = await db.select().from(hallmarks).where(eq(hallmarks.thId, `${PREFIX}-00000001`));

  if (existing.length > 0) {
    console.log(`Genesis hallmark ${PREFIX}-00000001 already exists.`);
    return;
  }

  await db.delete(hallmarkCounter).where(eq(hallmarkCounter.id, `${PREFIX.toLowerCase()}-master`));

  const genesis = await generateHallmark({
    appId: "trustgolf-genesis",
    appName: APP_NAME,
    productName: "Genesis Block",
    releaseType: "genesis",
    metadata: {
      ecosystem: "Trust Layer",
      version: "1.0.0",
      domain: DOMAIN,
      operator: "DarkWave Studios LLC",
      chain: "Trust Layer Blockchain",
      consensus: "Proof of Trust",
      launchDate: "2026-08-23T00:00:00.000Z",
      nativeAsset: "SIG",
      utilityToken: "Shells",
      parentApp: "Trust Layer Hub",
      parentGenesis: "TH-00000001",
    },
  });

  console.log(`Genesis hallmark created: ${genesis.thId}`);
}

export async function verifyHallmark(thId: string): Promise<{ verified: boolean; hallmark?: any }> {
  const [hallmark] = await db.select().from(hallmarks).where(eq(hallmarks.thId, thId));

  if (!hallmark) {
    return { verified: false };
  }

  return {
    verified: true,
    hallmark: {
      thId: hallmark.thId,
      appName: hallmark.appName,
      productName: hallmark.productName,
      releaseType: hallmark.releaseType,
      metadata: hallmark.metadata,
      dataHash: hallmark.dataHash,
      txHash: hallmark.txHash,
      blockHeight: hallmark.blockHeight,
      createdAt: hallmark.createdAt,
    },
  };
}

export async function getGenesisHallmark(): Promise<any> {
  const [hallmark] = await db.select().from(hallmarks).where(eq(hallmarks.thId, `${PREFIX}-00000001`));
  return hallmark || null;
}
