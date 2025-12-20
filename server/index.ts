import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./drizzle/client";
import { users } from "../drizzle/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, String(email).toLowerCase())).limit(1);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });
  } catch (error) {
    console.error("[auth/login] erro:", error);
    return res.status(500).json({ error: "Erro ao autenticar" });
  }
});

// Serve frontend buildado (dist/public)
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// Fallback SPA
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`✅ Server rodando na porta ${port}`);
});

