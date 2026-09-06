import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import "dotenv/config";

const GITHUB_USERNAME = 'Bernal-XFK';
const EXCLUDED_REPOS = ['Bernal-XFK', 'Portfolio'];

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
          const image = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${defaultBranch}/cover.png`;
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
