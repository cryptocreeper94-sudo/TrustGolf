import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { usePathname } from "expo-router";
import { getApiUrl } from "@/lib/query-client";

function getVisitorId(): string {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return `v_native_${Date.now()}`;
  let id = localStorage.getItem("tg_visitor_id");
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("tg_visitor_id", id);
  }
  return id;
}

function getSessionId(): string {
  if (Platform.OS !== "web" || typeof sessionStorage === "undefined") return `s_native_${Date.now()}`;
  let id = sessionStorage.getItem("tg_session_id");
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("tg_session_id", id);
  }
  return id;
}

function getUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (Platform.OS !== "web" || typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
  } catch {
    return {};
  }
}

async function sendAnalytics(endpoint: string, data: any) {
  try {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
  } catch {}
}

export function useAnalytics() {
  const pathname = usePathname();
  const sessionCreated = useRef(false);
  const lastPath = useRef("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visitorId = useRef(getVisitorId());
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    if (sessionCreated.current) return;
    sessionCreated.current = true;

    const utm = getUtmParams();
    sendAnalytics("/api/analytics/session", {
      visitorId: visitorId.current,
      sessionId: sessionId.current,
      landingPage: pathname || "/",
      referrer: Platform.OS === "web" && typeof document !== "undefined" ? document.referrer : undefined,
      ...utm,
    });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleUnload = () => {
        const baseUrl = getApiUrl();
        const url = new URL(`/api/analytics/session/${sessionId.current}/end`, baseUrl);
        navigator.sendBeacon(url.toString(), JSON.stringify({}));
      };
      window.addEventListener("beforeunload", handleUnload);
      return () => window.removeEventListener("beforeunload", handleUnload);
    }
  }, []);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      sendAnalytics("/api/analytics/pageview", {
        visitorId: visitorId.current,
        sessionId: sessionId.current,
        path: pathname,
        title: Platform.OS === "web" && typeof document !== "undefined" ? document.title : pathname,
      });
    }, 150);
  }, [pathname]);

  const trackEvent = useCallback((eventName: string, category?: string, label?: string, value?: number, metadata?: any) => {
    sendAnalytics("/api/analytics/event", {
      visitorId: visitorId.current,
      sessionId: sessionId.current,
      eventName,
      category,
      label,
      value,
      metadata,
    });
  }, []);

  return { trackEvent };
}
