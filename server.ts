import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  GITHUB_USERNAME,
  buildGitHubHeaders,
  getErrorMessage,
  isVisibleRepo,
  mapRepoToProject,
  type GitHubRepo,
  type Project,
} from "./api/github-shared";

async function startServer(): Promise<express.Express> {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "20kb" }));

  // ---- POST /api/contact (dev/prod Express) ----
  // Validación manual (sin zod): nombre/email/mensaje + max lengths,
  // honeypot anti-spam, rate-limit en memoria (5/min por IP) y sanitización básica.
  const CONTACT_WINDOW_MS = 60_000;
  const CONTACT_MAX_PER_WINDOW = 5;
  const contactHits = new Map<string, number[]>();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const FALLBACK_TO = "jabernal.4395@unicesmag.edu.co";

  function getClientIp(req: express.Request): string {
    const fwd = req.headers["x-forwarded-for"];
    if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
    return req.ip || req.socket.remoteAddress || "unknown";
  }

  function isContactRateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (contactHits.get(ip) ?? []).filter((t) => now - t < CONTACT_WINDOW_MS);
    if (hits.length >= CONTACT_MAX_PER_WINDOW) {
      contactHits.set(ip, hits);
      return true;
    }
    hits.push(now);
    contactHits.set(ip, hits);
    return false;
  }

  function sanitizeText(input: unknown, max: number): string {
    if (typeof input !== "string") return "";
    return input.replace(/\0/g, "").replace(/<[^>]*>/g, "").trim().slice(0, max);
  }

  function stripNewlines(input: string): string {
    return input.replace(/[\r\n]+/g, " ").trim();
  }

  function buildContactMailto(to: string, name: string, email: string, message: string): string {
    const subject = `Portfolio: nuevo mensaje de ${name}`;
    const body = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  app.post("/api/contact", async (req, res) => {
    try {
      // Honeypot: campo "website" debe venir vacío. Si viene relleno es un bot:
      // respondemos ok falso-positivo sin enviar nada (no revelamos el filtro).
      if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
        return res.status(200).json({ ok: true });
      }

      const ip = getClientIp(req);
      if (isContactRateLimited(ip)) {
        res.setHeader("Retry-After", "60");
        return res.status(429).json({ ok: false, error: "Demasiados mensajes. Inténtalo de nuevo en un minuto." });
      }

      const rawName = sanitizeText(req.body?.name, 100);
      const rawEmail = sanitizeText(req.body?.email, 254);
      const rawMessage = sanitizeText(req.body?.message, 5000);

      const details: Record<string, string> = {};
      if (rawName.length < 2) details.name = "El nombre debe tener al menos 2 caracteres (máx. 100).";
      if (!EMAIL_RE.test(rawEmail)) details.email = "Email no válido (máx. 254 caracteres).";
      if (rawMessage.length < 10) details.message = "El mensaje debe tener al menos 10 caracteres (máx. 5000).";

      if (Object.keys(details).length > 0) {
        return res.status(400).json({ ok: false, error: "Revisa los campos del formulario.", details });
      }

      // Sanitización para cabeceras SMTP (evita header injection) + cuerpo ya sin tags.
      const name = stripNewlines(rawName).slice(0, 100);
      const email = stripNewlines(rawEmail).slice(0, 254);
      const message = rawMessage;

      const contactTo = (process.env.CONTACT_TO || FALLBACK_TO).trim();
      const mailto = buildContactMailto(contactTo, name, email, message);

      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      const smtpReady = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && process.env.CONTACT_TO);

      if (!smtpReady) {
        console.log(`[contact:log] from="${name}" <${email}> to="${contactTo}" ip="${ip}" message="${message.slice(0, 500)}"`);
        return res.status(200).json({ ok: true, delivered: "log", mailto });
      }

      try {
        const port = Number(SMTP_PORT) || 587;
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port,
          secure: port === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await transporter.sendMail({
          from: SMTP_FROM || SMTP_USER,
          to: contactTo,
          replyTo: email,
          subject: `Portfolio: nuevo mensaje de ${name}`,
          text: `Nombre: ${name}\nEmail: ${email}\nIP: ${ip}\n\n${message}`,
        });
        return res.status(200).json({ ok: true, delivered: "smtp" });
      } catch (mailError: unknown) {
        console.error("[contact:smtp-error]", getErrorMessage(mailError));
        return res.status(502).json({ ok: false, error: "No se pudo enviar el mensaje. Inténtalo por email directo.", mailto });
      }
    } catch (handlerError: unknown) {
      console.error("[contact:error]", getErrorMessage(handlerError));
      return res.status(500).json({ ok: false, error: "Error interno al procesar el mensaje." });
    }
  });

  function getContactStatus(): {
    ok: boolean;
    mode: string;
    smtpReady: boolean;
    hasHost: boolean;
    hasUser: boolean;
    hasPass: boolean;
    hasContactTo: boolean;
    hasFrom: boolean;
    port: number;
  } {
    // Diagnóstico sin exponer secretos: solo booleanos + puerto (no secreto).
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    const hasHost = Boolean(SMTP_HOST);
    const hasUser = Boolean(SMTP_USER);
    const hasPass = Boolean(SMTP_PASS);
    const hasContactTo = Boolean(process.env.CONTACT_TO);
    const smtpReady = Boolean(hasHost && hasUser && hasPass && hasContactTo);
    return {
      ok: true,
      mode: smtpReady ? "smtp" : "log",
      smtpReady,
      hasHost,
      hasUser,
      hasPass,
      hasContactTo,
      hasFrom: Boolean(SMTP_FROM),
      port: Number(SMTP_PORT) || 587,
    };
  }

  app.get("/api/contact/status", (_req, res) => {
    return res.status(200).json(getContactStatus());
  });

  // GitHub API Route for Local Preview (AI Studio)
  app.get("/api/projects", async (_req, res) => {
    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`,
        { headers: buildGitHubHeaders(process.env.GITHUB_TOKEN) },
      );

      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
      const githubRepos = (await response.json()) as GitHubRepo[];
      const projects: Project[] = githubRepos.filter(isVisibleRepo).map(mapRepoToProject);

      res.json(projects);
    } catch (fetchError: unknown) {
      res.status(500).json({ error: "Error al conectar con GitHub localmente.", details: getErrorMessage(fetchError) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running as a serverless function (like on Vercel)
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
