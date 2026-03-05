# Bomber 3D ↔ TrustGolf API Integration Handoff

**From**: TrustGolf (trustgolf.tlid.io)
**To**: Bomber 3D (bomber.tlid.io)
**Date**: March 2026
**Ecosystem**: Trust Layer | Bomber prefix: `BO` | Genesis: `BO-00000001` | Parent: `TH-00000001`

---

## 1. API Base URL

**Production**: `https://trustgolf.app/api/...`

All endpoints are prefixed with `/api/`. Example:
```
GET  https://trustgolf.app/api/bomber/profile/{userId}
POST https://trustgolf.app/api/bomber/drive
```

---

## 2. Authentication

**Method**: `userId`-based identity (no JWT/API key required)

- Users register or log in via `/api/auth/register` or `/api/auth/login`, which returns a user object containing `id` (UUID string).
- All subsequent requests pass this `userId` in the URL parameter or request body.
- There is no token refresh flow — the `userId` is persistent.
- CORS is pre-configured for `https://bomber.tlid.io` and `https://bomber-3d.vercel.app`.

**Auth Endpoints** (if Bomber needs its own login/register flow):

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| `POST` | `/api/auth/register` | `{ username, email, password, displayName, referralHash? }` | User object with `id` |
| `POST` | `/api/auth/login` | `{ username, password }` | User object with `id` |

---

## 3. Bomber Game Endpoints (Full List)

### Player Profile

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/profile/{userId}` | URL: `userId` | Get or auto-create player profile |
| `POST` | `/api/bomber/unlock-pro/{userId}` | Body: `{ receiptData, platform }` | Grant Bomber Pro status |
| `POST` | `/api/bomber/restore-pro/{userId}` | URL: `userId` | Check/restore Pro status |

### Drives & Gameplay

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/bomber/drive` | Body: `{ userId, distanceYards, carryYards, rollYards, ballSpeedMph, launchAngleDeg, windSpeedMph, nightMode, inBounds, accuracy, equipmentUsed, username, venueId }` | Submit a drive (auto-translates field names) |

### Leaderboard

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/leaderboard` | — | Global top 50 |
| `GET` | `/api/bomber/leaderboard/{venueId}` | URL: `venueId` (use `"all"` for global) | Venue-filtered leaderboard |

### Equipment

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/equipment/{userId}` | URL: `userId` | Get all owned equipment |
| `POST` | `/api/bomber/equipment/{id}/upgrade` | URL: `id`, Body: `{ userId }` | Upgrade equipment with duplicates |
| `POST` | `/api/bomber/equip` | Body: `{ userId, equipmentId, type }` | Equip driver or ball (`type`: `"driver"` or `"ball"`) |

### Chests & Rewards

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/bomber/chest/open` | Body: `{ userId, chestId }` | Open a chest |
| `POST` | `/api/bomber/daily-reward` | Body: `{ userId }` | Claim daily reward |

### Contests

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/contest/available/{userId}` | URL: `userId` | Check contest eligibility |
| `POST` | `/api/bomber/contest/submit` | Body: `{ userId }` | Use a contest entry |

### Venues

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/venues` | — | List all venues |
| `GET` | `/api/bomber/venues/unlocks/{userId}` | URL: `userId` | List user's unlocked venues |
| `POST` | `/api/bomber/venues/unlock` | Body: `{ userId, venueId }` | Unlock venue (costs coins/gems) |

### Tournaments

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/tournaments` | Query: `?active=true` | List tournaments |
| `GET` | `/api/bomber/tournaments/{tournamentId}` | URL: `tournamentId` | Tournament details + leaderboard |
| `POST` | `/api/bomber/tournaments/enter` | Body: `{ tournamentId, userId, username }` | Enter a tournament |
| `POST` | `/api/bomber/tournaments/drive` | Body: `{ tournamentId, userId, distance }` | Record tournament drive |

### Achievements

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/achievements/{userId}` | URL: `userId` | List earned achievements |
| `POST` | `/api/bomber/achievements/check` | Body: `{ userId, nightMode, wind, contestWins }` | Evaluate & grant new achievements |

### Daily Challenges

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/bomber/challenges/today` | — | Get today's daily challenge |

---

## 4. Hallmark Verification

Each app verifies hallmarks independently via TrustGolf's API. There is no central verification service yet.

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/hallmark/genesis` | — | Returns TrustGolf genesis hallmark (`TG-00000001`) |
| `GET` | `/api/hallmark/{thId}/verify` | URL: `thId` (e.g., `TG-00000001`) | Verify any hallmark by ID |

**Response format** (`/verify`):
```json
{
  "verified": true,
  "hallmark": {
    "thId": "TG-00000001",
    "appName": "Trust Golf",
    "productName": "Genesis Block",
    "releaseType": "genesis",
    "metadata": {
      "ecosystem": "Trust Layer",
      "domain": "trustgolf.tlid.io",
      "operator": "DarkWave Studios LLC",
      "chain": "Trust Layer Blockchain",
      "consensus": "Proof of Trust",
      "nativeAsset": "SIG",
      "utilityToken": "Shells",
      "parentApp": "Trust Layer Hub",
      "parentGenesis": "TH-00000001"
    },
    "dataHash": "sha256...",
    "txHash": "0x...",
    "blockHeight": "1234567",
    "createdAt": "2026-..."
  }
}
```

**For Bomber**: Your genesis hallmark is `BO-00000001`. Bomber should implement its own hallmark table and `seedGenesisHallmark()` on boot, referencing `parentGenesis: "TH-00000001"`. Cross-app verification can be done by calling TrustGolf's `/api/hallmark/{thId}/verify` endpoint for TG-prefixed hallmarks.

---

## 5. Affiliate / Referral Tracking

The affiliate system uses a shared `uniqueHash` per user across all 33 ecosystem apps. Commission tiers: Base 10% → Silver 12.5% → Gold 15% → Platinum 17.5% → Diamond 20%. Payouts in SIG, minimum 10 SIG.

| Method | Endpoint | Params / Body | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/affiliate/track` | Body: `{ referralHash, platform }` | Track a referral click. Set `platform` to `"bomber"` for Bomber referrals |
| `GET` | `/api/affiliate/dashboard?userId={id}` | Query: `userId` | Full affiliate stats (tier, earnings, referrals) |
| `GET` | `/api/affiliate/link?userId={id}` | Query: `userId` | Get user's referral links for all 32 ecosystem apps |
| `POST` | `/api/affiliate/request-payout` | Body: `{ userId }` | Request payout of pending commissions (min 10 SIG) |

**Cross-app referral flow**:
1. User visits `https://bomber.tlid.io/ref/{uniqueHash}`
2. Bomber stores `uniqueHash` locally and calls `POST /api/affiliate/track` with `{ referralHash: uniqueHash, platform: "bomber" }`
3. When user registers, pass `referralHash` in the registration body
4. On email verification, the referral is auto-converted via `convertReferral()`
5. On any purchase (e.g., Bomber Pro), `processSale()` auto-creates a commission for the referrer

**Payout request response**:
```json
{
  "success": true,
  "amount": "25.00",
  "currency": "SIG",
  "commissionsCount": 3
}
```

---

## 6. Ecosystem Registry

Each app currently maintains its own copy of the 33-app registry. There is no central endpoint yet. The full registry is stored in `server/affiliate.ts` with all 33 apps including prefix, genesis mark, and domain. The `GET /api/affiliate/link` endpoint returns cross-platform referral links for all 32 partner apps.

---

## 7. Webhooks

TrustGolf does **not** currently send outbound webhooks to connected ecosystem apps. The only webhook in the system is an inbound endpoint for TrustVault media rendering callbacks:

```
POST /api/trustvault/webhook
Headers: x-app-id: dw_app_trustvault, x-app-name: Trust Vault
```

**Future consideration**: When the Trust Layer Hub is live, it could serve as a central webhook dispatcher for cross-app events (new referral, payout completed, user registered).

---

## 8. Rate Limits

- **No formal rate limiting** is applied to API endpoints currently.
- Standard courtesy limits apply — avoid excessive polling. Recommended: cache leaderboard calls, poll profile data at most every 30 seconds.
- The OpenAI-backed endpoints (swing analysis) have upstream rate limiting from the AI provider, but these are not relevant to Bomber.

---

## 9. CORS Configuration

Already configured in `server/index.ts`:
```
Allowed origins:
  - https://bomber.tlid.io ✅
  - https://bomber-3d.vercel.app ✅
  - http://localhost:* (dev) ✅
  - http://127.0.0.1:* (dev) ✅

Allowed methods: GET, POST, PUT, DELETE, OPTIONS
Allowed headers: Content-Type
Credentials: enabled
```

---

## 10. Quick Start for Bomber Integration

```javascript
const API_BASE = "https://trustgolf.app";

// 1. Get or create player profile
const profile = await fetch(`${API_BASE}/api/bomber/profile/${userId}`).then(r => r.json());

// 2. Submit a drive
await fetch(`${API_BASE}/api/bomber/drive`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId,
    distanceYards: 342.5,
    carryYards: 310.2,
    rollYards: 32.3,
    ballSpeedMph: 178,
    launchAngleDeg: 12.5,
    windSpeedMph: 8,
    nightMode: false,
    inBounds: true,
    accuracy: 85,
    equipmentUsed: { driver: "TLD-1", ball: "distance-pro" },
    username: "PlayerName",
    venueId: 1
  })
});

// 3. Get leaderboard
const leaderboard = await fetch(`${API_BASE}/api/bomber/leaderboard/all`).then(r => r.json());

// 4. Track a referral from Bomber
await fetch(`${API_BASE}/api/affiliate/track`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ referralHash: "abc123def456", platform: "bomber" })
});

// 5. Verify TrustGolf genesis hallmark
const hallmark = await fetch(`${API_BASE}/api/hallmark/TG-00000001/verify`).then(r => r.json());
```

---

## Summary

| Question | Answer |
|----------|--------|
| API Base URL | `https://trustgolf.app` |
| Auth method | `userId` in body/URL (no JWT/API key) |
| Bomber endpoints | 25+ endpoints, all prefixed `/api/bomber/` |
| Hallmark verification | `GET /api/hallmark/{thId}/verify` (per-app, not centralized) |
| Affiliate tracking | `POST /api/affiliate/track` with `platform: "bomber"` |
| Leaderboard | `GET /api/bomber/leaderboard/{venueId}` |
| Ecosystem registry | Local copy per app (no central endpoint yet) |
| Payout flow | `POST /api/affiliate/request-payout` (min 10 SIG) |
| Webhooks | None outbound to ecosystem apps (yet) |
| Rate limits | None enforced (use courtesy limits) |
| CORS | `bomber.tlid.io` already whitelisted |
