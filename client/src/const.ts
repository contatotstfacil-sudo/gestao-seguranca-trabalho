export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Sempre usa login tradicional por padrão
  // Se VITE_USE_TRADITIONAL_LOGIN estiver definido como "0", tenta usar OAuth
  if (import.meta.env.VITE_USE_TRADITIONAL_LOGIN === "0") {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
    const appId = import.meta.env.VITE_APP_ID as string | undefined;

    // Se não houver OAuth configurado, usa login tradicional
    if (!oauthPortalUrl || !appId) {
      console.warn(
        "[Auth] VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set. Using traditional login."
      );
      return "/login";
    }

    // Em desenvolvimento, se VITE_FORCE_OAUTH não estiver definido, usa login tradicional
    if (import.meta.env.DEV && import.meta.env.VITE_FORCE_OAUTH !== "1") {
      return "/login";
    }

    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(redirectUri);

    let baseUrl: URL;
    try {
      const normalized = oauthPortalUrl.replace(/\/$/, "");
      baseUrl = new URL(`${normalized}/app-auth`);
    } catch {
      console.warn("[Auth] Invalid VITE_OAUTH_PORTAL_URL. Using traditional login.");
      return "/login";
    }

    baseUrl.searchParams.set("appId", appId);
    baseUrl.searchParams.set("redirectUri", redirectUri);
    baseUrl.searchParams.set("state", state);
    baseUrl.searchParams.set("type", "signIn");

    return baseUrl.toString();
  }

  // Por padrão, usa login tradicional
  return "/login";
};