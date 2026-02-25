const TRUSTVAULT_BASE_URL = "https://trustvault.replit.app/api/studio";

async function vaultFetch(path: string, token: string, options: RequestInit = {}) {
  const url = `${TRUSTVAULT_BASE_URL}${path}`;
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

export async function getTrustVaultCapabilities() {
  const res = await fetch(`${TRUSTVAULT_BASE_URL}/capabilities`);
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
