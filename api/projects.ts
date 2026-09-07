import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  GITHUB_USERNAME,
  buildGitHubHeaders,
  getErrorMessage,
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
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const githubRepos = (await response.json()) as GitHubRepo[];
    const projects: Project[] = githubRepos.filter(isVisibleRepo).map(mapRepoToProject);

    // Cache por 1 hora (evita quemar la API de GitHub en Vercel)
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(projects);
  } catch (error: unknown) {
    console.error("GitHub Fetch Error:", error);

    return res.status(500).json({
      error: "Error al conectar con GitHub.",
      details: getErrorMessage(error),
    });
  }
}
