import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  GITHUB_USERNAME,
  buildFallbackProjects,
  buildGitHubHeaders,
  isVisibleRepo,
  mapRepoToProject,
  type GitHubRepo,
  type Project,
} from "./github-shared";

// El token de GitHub es opcional para repositorios públicos, pero Vercel lo requiere
// usualmente para evitar el límite de peticiones (Rate Limit) de IPs compartidas.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "X-Data-Source");

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
      const remaining = response.headers.get("x-ratelimit-remaining");
      const reset = response.headers.get("x-ratelimit-reset");
      const resetIn = reset ? Math.max(0, Number(reset) * 1000 - Date.now()) : null;
      console.error(
        `GitHub API error: ${response.status} ${response.statusText} ` +
          `(remaining=${remaining ?? "?"}, hasToken=${Boolean(GITHUB_TOKEN)})`,
      );
      // Rate limit / auth / upstream caído → fallback local con 200 para que
      // Vercel nunca deje la sección vacía. Cache corto para reintentar pronto.
      const fallback = buildFallbackProjects();
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
      res.setHeader("X-Data-Source", "fallback");
      if (resetIn !== null && Number.isFinite(resetIn)) {
        res.setHeader("Retry-After", String(Math.ceil(resetIn / 1000)));
      }
      return res.status(200).json(fallback);
    }

    const githubRepos = (await response.json()) as GitHubRepo[];
    const projects: Project[] = githubRepos.filter(isVisibleRepo).map(mapRepoToProject);

    // Cache por 1 hora (evita quemar la API de GitHub en Vercel)
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.setHeader("X-Data-Source", "github");
    return res.status(200).json(projects);
  } catch (error: unknown) {
    console.error("GitHub Fetch Error:", error);

    // Caída de red/DNS en serverless → mismo fallback local (200).
    const fallback = buildFallbackProjects();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    res.setHeader("X-Data-Source", "fallback");
    return res.status(200).json(fallback);
  }
}
