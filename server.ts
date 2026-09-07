import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import "dotenv/config";

const GITHUB_USERNAME = 'Bernal-XFK';
const EXCLUDED_REPOS = ['Bernal-XFK', 'Portfolio'];

// Covers locales generados (public/covers/<repo>.svg, 1200x630, paleta del portfolio).
// Tienen prioridad sobre el cover.png remoto; el opengraph de GitHub queda como fallback.
const CUSTOM_IMAGES: Record<string, string> = {
  'remix-jose-bernal---creative-portfolio': '/covers/remix-jose-bernal---creative-portfolio.svg',
  'jose-bernal-portfolio': '/covers/jose-bernal-portfolio.svg',
  'Experiencia-Interactiva-AR-Pokemon': '/covers/Experiencia-Interactiva-AR-Pokemon.svg',
  'Portafolio-Creativo': '/covers/Portafolio-Creativo.svg',
  'MACTDEMAT': '/covers/MACTDEMAT.svg',
  'WaveMood': '/covers/WaveMood.svg',
  'Fase4Sergio_Bola-os': '/covers/Fase4Sergio_Bola-os.svg',
  'Fase3Sergio_Bola-os': '/covers/Fase3Sergio_Bola-os.svg',
  'Fase2Sergio_Bola-os': '/covers/Fase2Sergio_Bola-os.svg',
  'OS': '/covers/OS.svg',
  'applet_Conversor_de_tiempo': '/covers/applet_Conversor_de_tiempo.svg',
  'applet_Facturacion_Sena': '/covers/applet_Facturacion_Sena.svg',
  'Videojuegos_programa_java': '/covers/Videojuegos_programa_java.svg',
  'Maraton-Java-Code-Gym': '/covers/Maraton-Java-Code-Gym.svg',
  'pets': '/covers/pets.svg',
  'advanced-programming': '/covers/advanced-programming.svg',
};

function formatTitle(name: string) {
  return name.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getLanguageColor(language: string | null) {
  switch (language?.toLowerCase()) {
    case 'javascript': return 'from-yellow-400 to-yellow-600';
    case 'typescript': return 'from-blue-400 to-blue-600';
    case 'python': return 'from-blue-500 to-yellow-500';
    case 'html': return 'from-orange-400 to-red-500';
    case 'css': return 'from-blue-400 to-blue-500';
    case 'java': return 'from-red-500 to-orange-500';
    case 'c++': return 'from-blue-600 to-indigo-700';
    case 'c#': return 'from-green-500 to-green-700';
    default: return 'from-gray-600 to-gray-800';
  }
}

function generateFallbackDescription(name: string, language: string | null, topics: string[]) {
  const tech = language || (topics && topics.length > 0 ? topics[0] : 'tecnologías modernas');
  return `Proyecto de desarrollo enfocado en la exploración y aplicación práctica de ${tech}.`;
}

async function startServer() {
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
      } catch (mailErr: any) {
        console.error("[contact:smtp-error]", mailErr?.message || mailErr);
        return res.status(502).json({ ok: false, error: "No se pudo enviar el mensaje. Inténtalo por email directo.", mailto });
      }
    } catch (err: any) {
      console.error("[contact:error]", err?.message || err);
      return res.status(500).json({ ok: false, error: "Error interno al procesar el mensaje." });
    }
  });

  function getContactStatus() {
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
  app.get("/api/projects", async (req, res) => {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-App'
      };

      const token = process.env.GITHUB_TOKEN;
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`, 
        { headers }
      );

      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
      const repos = await response.json();

      const projects = repos
        .filter((repo: any) => !repo.fork && !EXCLUDED_REPOS.includes(repo.name))
        .map((repo: any) => {
          const title = formatTitle(repo.name);
          const description = repo.description || generateFallbackDescription(repo.name, repo.language, repo.topics);
          const defaultBranch = repo.default_branch || 'main';
          // Estrategia de imagen: cover local > cover.png remoto > opengraph (fallback en frontend).
          const remoteCover = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${defaultBranch}/cover.png`;
          const image = CUSTOM_IMAGES[repo.name] || remoteCover;
          const fallbackImage = `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${repo.name}`;
          
          const tech = [];
          if (repo.language) tech.push(repo.language);
          if (repo.topics) tech.push(...repo.topics);

          return {
            id: repo.id.toString(),
            title,
            description,
            image,
            fallbackImage: fallbackImage,
            fallbackColor: getLanguageColor(repo.language),
            demo: repo.homepage || '#',
            github: repo.html_url,
            tech: Array.from(new Set(tech)).slice(0, 4),
            stars: repo.stargazers_count || 0
          };
        });

      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: "Error al conectar con GitHub localmente.", details: error.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running as a serverless function (like on Vercel)
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
