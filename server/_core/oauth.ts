import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Dev-only login helper to bypass external OAuth while developing locally
  // NOTA: Este endpoint está desabilitado por padrão. Use o login tradicional em /login
  if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_LOGIN === "1") {
    app.get("/api/oauth/dev-login", async (_req: Request, res: Response) => {
      try {
        const openId = "dev-user";
        const name = "Developer";

        await db.upsertUser({
          openId,
          name,
          email: null,
          loginMethod: "dev",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.signSession({
          openId,
          appId: process.env.VITE_APP_ID || process.env.APP_ID || "dev-app",
          name,
        });

        const cookieOptions = getSessionCookieOptions(_req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      } catch (error) {
        console.error("[OAuth] Dev login failed", error);
        res.status(500).json({ error: "Dev login failed", details: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
