import crypto from "crypto";

const TRUSTVAULT_BASE_URL = process.env.DW_MEDIA_BASE_URL || "https://trustvault.replit.app";
const STUDIO_URL = `${TRUSTVAULT_BASE_URL}/api/studio`;
const ECOSYSTEM_URL = `${TRUSTVAULT_BASE_URL}/api/ecosystem`;

function generateHmacAuth(): { authorization: string; timestamp: string } {
  const apiKey = process.env.DW_MEDIA_API_KEY;
  const apiSecret = process.env.DW_MEDIA_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("DW_MEDIA_API_KEY and DW_MEDIA_API_SECRET are required for server-to-server auth");
  }
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${timestamp}:${apiKey}`)
    .digest("hex");
  return {
    authorization: `DW ${apiKey}:${timestamp}:${signature}`,
    timestamp,
  };
}

async function vaultFetch(path: string, token: string, options: RequestInit = {}) {
  const url = `${STUDIO_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`TrustVault API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function ecosystemFetch(path: string, options: RequestInit = {}) {
  const { authorization } = generateHmacAuth();
  const url = `${ECOSYSTEM_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": authorization,
      "X-App-Name": "trustgolf",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`TrustVault Ecosystem API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getTrustVaultCapabilities() {
  const res = await fetch(`${STUDIO_URL}/capabilities`);
  if (!res.ok) throw new Error("Failed to fetch TrustVault capabilities");
  return res.json();
}

export async function getTrustVaultStatus(token: string) {
  return vaultFetch("/status", token);
}

export async function listMedia(
  token: string,
  options?: { category?: string; page?: number; limit?: number }
) {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  return vaultFetch(`/media/list${qs ? `?${qs}` : ""}`, token);
}

export async function getMediaItem(token: string, id: number) {
  return vaultFetch(`/media/${id}`, token);
}

export async function getUploadUrl(
  token: string,
  name: string,
  contentType: string,
  size: number
) {
  return vaultFetch("/media/upload", token, {
    method: "POST",
    body: JSON.stringify({ name, contentType, size }),
  });
}

export async function confirmUpload(
  token: string,
  details: {
    title: string;
    url: string;
    filename: string;
    contentType: string;
    size: number;
    tags?: string[];
  }
) {
  return vaultFetch("/media/confirm", token, {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function getEditorEmbed(
  token: string,
  editorType: "image" | "video" | "audio" | "merge",
  mediaId?: number,
  returnUrl?: string
) {
  return vaultFetch("/editor/embed-token", token, {
    method: "POST",
    body: JSON.stringify({ editorType, mediaId, returnUrl }),
  });
}

export async function createProject(
  token: string,
  title: string,
  type: string,
  description?: string
) {
  return vaultFetch("/projects/create", token, {
    method: "POST",
    body: JSON.stringify({ title, type, description }),
  });
}

export async function getProjectStatus(token: string, projectId: number) {
  return vaultFetch(`/projects/${projectId}/status`, token);
}

export async function exportProject(
  token: string,
  projectId: number,
  webhookUrl: string
) {
  return vaultFetch(`/projects/${projectId}/export`, token, {
    method: "POST",
    body: JSON.stringify({ webhookUrl }),
  });
}

export async function ecosystemUpload(
  name: string,
  contentType: string,
  size: number
) {
  return ecosystemFetch("/media/upload", {
    method: "POST",
    body: JSON.stringify({ name, contentType, size }),
  });
}

export async function ecosystemConfirmUpload(details: {
  title: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  tags?: string[];
}) {
  return ecosystemFetch("/media/confirm", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function ecosystemListMedia(
  options?: { category?: string; page?: number; limit?: number }
) {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  return ecosystemFetch(`/media/list${qs ? `?${qs}` : ""}`);
}

export async function ecosystemStatus() {
  return ecosystemFetch("/status");
}
