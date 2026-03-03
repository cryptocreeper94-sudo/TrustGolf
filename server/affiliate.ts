import crypto from "crypto";
import { db } from "./db";
import { users, affiliateReferrals, affiliateCommissions } from "@shared/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";
import { createTrustStamp } from "./hallmark";

const TIERS = [
  { name: "diamond", minReferrals: 50, rate: 0.20 },
  { name: "platinum", minReferrals: 30, rate: 0.175 },
  { name: "gold", minReferrals: 15, rate: 0.15 },
  { name: "silver", minReferrals: 5, rate: 0.125 },
  { name: "base", minReferrals: 0, rate: 0.10 },
];

const ECOSYSTEM_APPS = [
  { name: "Trust Layer Hub", domain: "trusthub.tlid.io" },
  { name: "TrustVault", domain: "trustvault.tlid.io" },
  { name: "THE VOID", domain: "thevoid.tlid.io" },
  { name: "Bomber", domain: "bomber.tlid.io" },
  { name: "TradeWorks AI", domain: "tradeworks.tlid.io" },
  { name: "Chronicles", domain: "chronicles.tlid.io" },
  { name: "The Arcade", domain: "thearcade.tlid.io" },
  { name: "ORBIT Staffing OS", domain: "orbit.tlid.io" },
  { name: "GarageBot", domain: "garagebot.tlid.io" },
  { name: "DarkWave Academy", domain: "darkwaveacademy.tlid.io" },
];

export function generateUniqueHash(): string {
  return crypto.randomBytes(6).toString("hex");
}

export async function getUserTier(userId: string): Promise<{ tier: string; rate: number; convertedCount: number }> {
  const result = await db.select({ count: count() })
    .from(affiliateReferrals)
    .where(and(eq(affiliateReferrals.referrerId, userId), eq(affiliateReferrals.status, "converted")));

  const convertedCount = result[0]?.count || 0;

  for (const tier of TIERS) {
    if (convertedCount >= tier.minReferrals) {
      return { tier: tier.name, rate: tier.rate, convertedCount };
    }
  }

  return { tier: "base", rate: 0.10, convertedCount };
}

export async function getAffiliateDashboard(userId: string): Promise<any> {
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (!user[0]) return null;

  const tierInfo = await getUserTier(userId);

  const totalReferrals = await db.select({ count: count() })
    .from(affiliateReferrals)
    .where(eq(affiliateReferrals.referrerId, userId));

  const convertedReferrals = await db.select({ count: count() })
    .from(affiliateReferrals)
    .where(and(eq(affiliateReferrals.referrerId, userId), eq(affiliateReferrals.status, "converted")));

  const pendingEarnings = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::TEXT` })
    .from(affiliateCommissions)
    .where(and(eq(affiliateCommissions.referrerId, userId), eq(affiliateCommissions.status, "pending")));

  const paidEarnings = await db.select({ total: sql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::TEXT` })
    .from(affiliateCommissions)
    .where(and(eq(affiliateCommissions.referrerId, userId), eq(affiliateCommissions.status, "paid")));

  const recentReferrals = await db.select()
    .from(affiliateReferrals)
    .where(eq(affiliateReferrals.referrerId, userId))
    .orderBy(desc(affiliateReferrals.createdAt))
    .limit(10);

  const recentCommissions = await db.select()
    .from(affiliateCommissions)
    .where(eq(affiliateCommissions.referrerId, userId))
    .orderBy(desc(affiliateCommissions.createdAt))
    .limit(10);

  const nextTier = TIERS.slice().reverse().find(t => t.minReferrals > tierInfo.convertedCount);

  return {
    uniqueHash: user[0].uniqueHash,
    tier: tierInfo.tier,
    commissionRate: tierInfo.rate,
    totalReferrals: totalReferrals[0]?.count || 0,
    convertedReferrals: convertedReferrals[0]?.count || 0,
    pendingEarnings: pendingEarnings[0]?.total || "0",
    paidEarnings: paidEarnings[0]?.total || "0",
    nextTier: nextTier ? { name: nextTier.name, requiredReferrals: nextTier.minReferrals } : null,
    recentReferrals,
    recentCommissions,
    tiers: TIERS.slice().reverse().map(t => ({
      name: t.name,
      minReferrals: t.minReferrals,
      rate: `${(t.rate * 100)}%`,
      current: tierInfo.tier === t.name,
    })),
  };
}

export async function getAffiliateLink(userId: string): Promise<any> {
  const user = await db.select().from(users).where(eq(users.id, userId));
  if (!user[0] || !user[0].uniqueHash) return null;

  const hash = user[0].uniqueHash;
  const primaryLink = `https://trustgolf.app/ref/${hash}`;
  const crossPlatformLinks = ECOSYSTEM_APPS.map(app => ({
    appName: app.name,
    link: `https://${app.domain}/ref/${hash}`,
  }));

  return {
    uniqueHash: hash,
    primaryLink,
    crossPlatformLinks,
  };
}

export async function trackReferral(referralHash: string, platform: string = "trustgolf"): Promise<any> {
  const referrer = await db.select().from(users).where(eq(users.uniqueHash, referralHash));
  if (!referrer[0]) return { error: "Invalid referral hash" };

  const [referral] = await db.insert(affiliateReferrals).values({
    referrerId: referrer[0].id,
    referralHash,
    platform,
    status: "pending",
  }).returning();

  return referral;
}

export async function convertReferral(referredUserId: string, referrerHash: string): Promise<any> {
  const pending = await db.select()
    .from(affiliateReferrals)
    .where(and(
      eq(affiliateReferrals.referralHash, referrerHash),
      eq(affiliateReferrals.status, "pending"),
    ))
    .orderBy(desc(affiliateReferrals.createdAt))
    .limit(1);

  if (!pending[0]) return null;

  const [updated] = await db.update(affiliateReferrals)
    .set({
      referredUserId,
      status: "converted",
      convertedAt: new Date(),
    })
    .where(eq(affiliateReferrals.id, pending[0].id))
    .returning();

  await createTrustStamp({
    userId: pending[0].referrerId,
    category: "affiliate-referral-converted",
    data: {
      referralId: updated.id,
      referredUserId,
      platform: updated.platform,
    },
  });

  return updated;
}

export async function processSale(purchasingUserId: string, amount: number, productName: string = "subscription"): Promise<any> {
  const referral = await db.select()
    .from(affiliateReferrals)
    .where(and(
      eq(affiliateReferrals.referredUserId, purchasingUserId),
      eq(affiliateReferrals.status, "converted"),
    ))
    .limit(1);

  if (!referral[0]) return null;

  const existingCommission = await db.select({ id: affiliateCommissions.id })
    .from(affiliateCommissions)
    .where(and(
      eq(affiliateCommissions.referralId, referral[0].id),
    ))
    .limit(1);

  if (existingCommission[0]) return existingCommission[0];

  const referrerId = referral[0].referrerId;
  const tierInfo = await getUserTier(referrerId);
  const commissionAmount = (amount * tierInfo.rate).toFixed(2);

  const [commission] = await db.insert(affiliateCommissions).values({
    referrerId,
    referralId: referral[0].id,
    amount: commissionAmount,
    currency: "SIG",
    tier: tierInfo.tier,
    status: "pending",
  }).returning();

  await createTrustStamp({
    userId: referrerId,
    category: "affiliate-commission-earned",
    data: {
      commissionId: commission.id,
      referredUserId: purchasingUserId,
      saleAmount: amount.toString(),
      commissionAmount,
      tier: tierInfo.tier,
      product: productName,
    },
  });

  return commission;
}

export async function requestPayout(userId: string): Promise<any> {
  const pendingCommissions = await db.select()
    .from(affiliateCommissions)
    .where(and(
      eq(affiliateCommissions.referrerId, userId),
      eq(affiliateCommissions.status, "pending"),
    ));

  if (pendingCommissions.length === 0) {
    return { error: "No pending commissions" };
  }

  const totalAmount = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  if (totalAmount < 10) {
    return { error: "Minimum payout is 10 SIG" };
  }

  for (const commission of pendingCommissions) {
    await db.update(affiliateCommissions)
      .set({ status: "processing" })
      .where(eq(affiliateCommissions.id, commission.id));
  }

  await createTrustStamp({
    userId,
    category: "affiliate-payout-request",
    data: {
      amount: totalAmount.toString(),
      currency: "SIG",
      commissionsCount: pendingCommissions.length,
    },
  });

  return {
    success: true,
    amount: totalAmount.toString(),
    currency: "SIG",
    commissionsCount: pendingCommissions.length,
  };
}
