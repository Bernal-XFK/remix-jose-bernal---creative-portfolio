// Lógica común GitHub → Project compartida por server.ts (Express local)
// y api/projects.ts (serverless Vercel). Fuente única de verdad: si se añade
// un cover o se excluye un repo, se toca solo este archivo.

export interface GitHubRepo {
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

export interface Project {
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

export const GITHUB_USERNAME = "Bernal-XFK";

// Repos que no se muestran en el portafolio (perfil README, etc.).
export const EXCLUDED_REPOS: readonly string[] = ["Bernal-XFK", "Portfolio"];

// Covers locales generados (public/covers/<repo>.svg, 1200x630, paleta del portfolio).
// Tienen prioridad sobre el cover.png remoto; el opengraph de GitHub queda como fallback.
export const CUSTOM_IMAGES: Record<string, string> = {
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

/** Convierte "mi-proyecto-web" en "Mi Proyecto Web". */
export function formatTitle(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getLanguageColor(language: string | null): string {
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

export function generateFallbackDescription(
  _repoName: string,
  language: string | null,
  topics: string[] | undefined,
): string {
  const tech =
    language || (topics && topics.length > 0 ? topics[0] : "tecnologías modernas");
  return `Proyecto de desarrollo enfocado en la exploración y aplicación práctica de ${tech}.`;
}

export function buildGitHubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Portfolio-App",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  return headers;
}

export function isVisibleRepo(repo: GitHubRepo): boolean {
  return !repo.fork && !EXCLUDED_REPOS.includes(repo.name);
}

/** Estrategia de imagen: cover local > cover.png remoto > opengraph (fallback en frontend). */
export function mapRepoToProject(repo: GitHubRepo): Project {
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

/** Extrae un mensaje legible de un error desconocido (catch sin `any`). */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.length > 0) return error;
  return "Error desconocido";
}
