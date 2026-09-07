// GET /api/projects (Vercel serverless) — AUTOCONTENIDO, cero imports en runtime.
//
// Causa raíz del HTTP 500 persistente en prod (commit 07a3632 no lo arregló):
// este repo tiene `"type": "module"` (package.json) y la versión anterior hacía
// `import { ... } from "./github-shared"` (api/projects.ts:2-10, sin extensión).
// En ESM nativo de Node (runtime serverless de Vercel) un import relativo SIN
// extensión lanza ERR_MODULE_NOT_FOUND en la CARGA del módulo, antes de que el
// handler se ejecute. El try/catch + fallback quedaban dentro del handler, así
// que nunca llegaban a correr → 500 en TODAS las peticiones, hubiera o no
// rate-limit de GitHub. Localmente (tsx/Vite/esbuild, moduleResolution=bundler)
// el import sin extensión sí resuelve, por eso el bug era invisible en dev.
// api/contact.ts sí funciona porque solo importa paquetes (@vercel/node como
// `import type` + nodemailer), ningún relativo sin extensión.
//
// Fix: todo el código necesario vive en este archivo (sin imports de valores).
// El único import es `import type` (borrado en compilación, cero riesgo runtime).
// Triple red de seguridad → siempre 200 con array JSON:
//   1. GitHub OK → X-Data-Source: github
//   2. GitHub falla (403/429/red) → fallback generado de CUSTOM_IMAGES (200)
//   3. Si hasta el fallback lanzara → HARDCODED_PROJECTS inline (200)
// Un try/catch EXTERNO envuelve todo el handler como última garantía.
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface GitHubRepo {
  id: number;
  name: string;
  fork: boolean;
  description: string | null;
  language: string | null;
  topics?: string[];
  default_branch?: string;
  homepage?: string | null;
  html_url: string;
  stargazers_count?: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  fallbackImage: string;
  fallbackColor: string;
  demo: string;
  github: string;
  tech: string[];
  stars: number;
}

const GITHUB_USERNAME = "Bernal-XFK";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const EXCLUDED_REPOS: readonly string[] = ["Bernal-XFK", "Portfolio"];

// Covers locales (public/covers/<repo>.svg). Copia de api/github-shared.ts.
const CUSTOM_IMAGES: Record<string, string> = {
  "remix-jose-bernal---creative-portfolio":
    "/covers/remix-jose-bernal---creative-portfolio.svg",
  "jose-bernal-portfolio": "/covers/jose-bernal-portfolio.svg",
  "Experiencia-Interactiva-AR-Pokemon":
    "/covers/Experiencia-Interactiva-AR-Pokemon.svg",
  "Portafolio-Creativo": "/covers/Portafolio-Creativo.svg",
  MACTDEMAT: "/covers/MACTDEMAT.svg",
  WaveMood: "/covers/WaveMood.svg",
  "Fase4Sergio_Bola-os": "/covers/Fase4Sergio_Bola-os.svg",
  "Fase3Sergio_Bola-os": "/covers/Fase3Sergio_Bola-os.svg",
  "Fase2Sergio_Bola-os": "/covers/Fase2Sergio_Bola-os.svg",
  OS: "/covers/OS.svg",
  applet_Conversor_de_tiempo: "/covers/applet_Conversor_de_tiempo.svg",
  applet_Facturacion_Sena: "/covers/applet_Facturacion_Sena.svg",
  Videojuegos_programa_java: "/covers/Videojuegos_programa_java.svg",
  "Maraton-Java-Code-Gym": "/covers/Maraton-Java-Code-Gym.svg",
  pets: "/covers/pets.svg",
  "advanced-programming": "/covers/advanced-programming.svg",
};

function formatTitle(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getLanguageColor(language: string | null): string {
  switch (language?.toLowerCase()) {
    case "javascript":
      return "from-yellow-400 to-yellow-600";
    case "typescript":
      return "from-blue-400 to-blue-600";
    case "python":
      return "from-blue-500 to-yellow-500";
    case "html":
      return "from-orange-400 to-red-500";
    case "css":
      return "from-blue-400 to-blue-500";
    case "java":
      return "from-red-500 to-orange-500";
    case "c++":
      return "from-blue-600 to-indigo-700";
    case "c#":
      return "from-green-500 to-green-700";
    default:
      return "from-gray-600 to-gray-800";
  }
}

function generateFallbackDescription(
  _repoName: string,
  language: string | null,
  topics: string[] | undefined,
): string {
  const tech =
    language || (topics && topics.length > 0 ? topics[0] : "tecnologías modernas");
  return `Proyecto de desarrollo enfocado en la exploración y aplicación práctica de ${tech}.`;
}

function buildGitHubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Portfolio-App",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  return headers;
}

function isVisibleRepo(repo: GitHubRepo): boolean {
  return !repo.fork && !EXCLUDED_REPOS.includes(repo.name);
}

function mapRepoToProject(repo: GitHubRepo): Project {
  const defaultBranch = repo.default_branch || "main";
  const remoteCover = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${defaultBranch}/cover.png`;
  const technologies: string[] = [];
  if (repo.language) technologies.push(repo.language);
  if (repo.topics) technologies.push(...repo.topics);

  return {
    id: repo.id.toString(),
    title: formatTitle(repo.name),
    description:
      repo.description ||
      generateFallbackDescription(repo.name, repo.language, repo.topics),
    image: CUSTOM_IMAGES[repo.name] || remoteCover,
    fallbackImage: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${repo.name}`,
    fallbackColor: getLanguageColor(repo.language),
    demo: repo.homepage || "#",
    github: repo.html_url,
    tech: Array.from(new Set(technologies)).slice(0, 4),
    stars: repo.stargazers_count || 0,
  };
}

function buildFallbackProjects(): Project[] {
  return Object.keys(CUSTOM_IMAGES)
    .sort((a, b) => a.localeCompare(b))
    .map((repoName, index) => ({
      id: `fallback-${index}-${repoName}`,
      title: formatTitle(repoName),
      description: generateFallbackDescription(repoName, null, undefined),
      image: CUSTOM_IMAGES[repoName],
      fallbackImage: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/${repoName}`,
      fallbackColor: getLanguageColor(null),
      demo: "#",
      github: `https://github.com/${GITHUB_USERNAME}/${repoName}`,
      tech: [],
      stars: 0,
    }));
}

// Último recurso: datos 100% estáticos, ninguna función ni variable interviene.
// Si algo de arriba lanzara (p. ej. Object.keys de un objeto corrupto), esto
// sigue devolviendo 200 con contenido útil.
const HARDCODED_PROJECTS: Project[] = [
  {
    id: "hardcoded-portafolio-creativo",
    title: "Portafolio Creativo",
    description:
      "Portafolio creativo con desarrollo frontend moderno y visualizaciones interactivas.",
    image: "/covers/Portafolio-Creativo.svg",
    fallbackImage: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/Portafolio-Creativo`,
    fallbackColor: "from-gray-600 to-gray-800",
    demo: "#",
    github: `https://github.com/${GITHUB_USERNAME}/Portafolio-Creativo`,
    tech: [],
    stars: 0,
  },
  {
    id: "hardcoded-wavemood",
    title: "WaveMood",
    description:
      "Proyecto de desarrollo enfocado en la exploración y aplicación práctica de tecnologías modernas.",
    image: "/covers/WaveMood.svg",
    fallbackImage: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/WaveMood`,
    fallbackColor: "from-gray-600 to-gray-800",
    demo: "#",
    github: `https://github.com/${GITHUB_USERNAME}/WaveMood`,
    tech: [],
    stars: 0,
  },
  {
    id: "hardcoded-remix-portfolio",
    title: "Remix Jose Bernal Creative Portfolio",
    description:
      "Portafolio creativo construido con Remix y React, desplegado en Vercel.",
    image: "/covers/remix-jose-bernal---creative-portfolio.svg",
    fallbackImage: `https://opengraph.githubassets.com/1/${GITHUB_USERNAME}/remix-jose-bernal---creative-portfolio`,
    fallbackColor: "from-gray-600 to-gray-800",
    demo: "#",
    github: `https://github.com/${GITHUB_USERNAME}/remix-jose-bernal---creative-portfolio`,
    tech: [],
    stars: 0,
  },
];

async function sendFallback(res: VercelResponse): Promise<VercelResponse> {
  let projects: Project[];
  try {
    projects = buildFallbackProjects();
    if (!Array.isArray(projects) || projects.length === 0) {
      projects = HARDCODED_PROJECTS;
    }
  } catch {
    projects = HARDCODED_PROJECTS;
  }
  try {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("X-Data-Source", "fallback");
  } catch {
    // Headers ya enviados o res mock: igual intentamos responder el body.
  }
  return res.status(200).json(projects);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  // Red exterior: cualquier throw inesperado (incluso en el fallback) → 200
  // con datos hardcodeados. Esta función NUNCA debe responder 500.
  try {
    try {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "X-Data-Source");
    } catch {
      // Seguir aunque los headers fallen.
    }

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Solo se permiten peticiones GET" });
    }

    try {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`,
        { headers: buildGitHubHeaders(GITHUB_TOKEN) },
      );

      if (!response.ok) {
        const reset = response.headers.get("x-ratelimit-reset");
        const resetIn = reset ? Math.max(0, Number(reset) * 1000 - Date.now()) : null;
        console.error(
          `GitHub API error: ${response.status} ${response.statusText} ` +
            `(hasToken=${Boolean(GITHUB_TOKEN)})`,
        );
        if (resetIn !== null && Number.isFinite(resetIn)) {
          try {
            res.setHeader("Retry-After", String(Math.ceil(resetIn / 1000)));
          } catch {
            // Ignorar: lo importante es el body 200.
          }
        }
        return await sendFallback(res);
      }

      const githubRepos = (await response.json()) as GitHubRepo[];
      const projects: Project[] = githubRepos.filter(isVisibleRepo).map(mapRepoToProject);

      try {
        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
        res.setHeader("X-Data-Source", "github");
      } catch {
        // Ignorar.
      }
      return res.status(200).json(projects);
    } catch (error: unknown) {
      console.error("GitHub Fetch Error:", error);
      return await sendFallback(res);
    }
  } catch (fatal: unknown) {
    // Última garantía: ni siquiera el fallback pudo construirse.
    console.error("Projects handler fatal:", fatal);
    try {
      try {
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
        res.setHeader("X-Data-Source", "fallback");
      } catch {
        // Ignorar.
      }
      return res.status(200).json(HARDCODED_PROJECTS);
    } catch {
      // Si hasta res.status falla, al menos terminar la respuesta.
      try {
        return res.status(200).json(HARDCODED_PROJECTS);
      } catch {
        return res.end() as unknown as VercelResponse;
      }
    }
  }
}
