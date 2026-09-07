import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// POST /api/contact (Vercel serverless).
// Misma contract que server.ts: validación manual, honeypot, rate-limit en
// memoria (best-effort por instancia serverless), sanitización básica y
// envío SMTP si hay env, si no log + mailto para fallback en frontend.

const CONTACT_WINDOW_MS = 60_000;
const CONTACT_MAX_PER_WINDOW = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FALLBACK_TO = "jabernal.4395@unicesmag.edu.co";

// Nota: en serverless este mapa vive por instancia (no es un límite global).
const contactHits = new Map<string, number[]>();

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].trim();
  return (req.socket?.remoteAddress as string) || "unknown";
}

function isRateLimited(ip: string): boolean {
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

function buildMailto(to: string, name: string, email: string, message: string): string {
  const subject = `Portfolio: nuevo mensaje de ${name}`;
  const body = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getStatus() {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  // GET /api/contact/status → debug sin secretos (¿SMTP configurado?).
  if (req.method === "GET") return res.status(200).json(getStatus());
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Solo se permiten peticiones POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});

    // Honeypot anti-spam: "website" debe venir vacío.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return res.status(200).json({ ok: true });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ ok: false, error: "Demasiados mensajes. Inténtalo de nuevo en un minuto." });
    }

    const rawName = sanitizeText(body.name, 100);
    const rawEmail = sanitizeText(body.email, 254);
    const rawMessage = sanitizeText(body.message, 5000);

    const details: Record<string, string> = {};
    if (rawName.length < 2) details.name = "El nombre debe tener al menos 2 caracteres (máx. 100).";
    if (!EMAIL_RE.test(rawEmail)) details.email = "Email no válido (máx. 254 caracteres).";
    if (rawMessage.length < 10) details.message = "El mensaje debe tener al menos 10 caracteres (máx. 5000).";

    if (Object.keys(details).length > 0) {
      return res.status(400).json({ ok: false, error: "Revisa los campos del formulario.", details });
    }

    const name = stripNewlines(rawName).slice(0, 100);
    const email = stripNewlines(rawEmail).slice(0, 254);
    const message = rawMessage;

    const contactTo = (process.env.CONTACT_TO || FALLBACK_TO).trim();
    const mailto = buildMailto(contactTo, name, email, message);

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
    } catch (mailErr: any) {
      console.error("[contact:smtp-error]", mailErr?.message || mailErr);
      return res.status(502).json({ ok: false, error: "No se pudo enviar el mensaje. Inténtalo por email directo.", mailto });
    }
  } catch (err: any) {
    console.error("[contact:error]", err?.message || err);
    return res.status(500).json({ ok: false, error: "Error interno al procesar el mensaje." });
  }
}
