import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_USERNAME = 'Bernal-XFK';
// El token de GitHub es opcional para repositorios públicos, pero Vercel lo requiere 
// usualmente para evitar el límite de peticiones (Rate Limit) de IPs compartidas.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

// Añade aquí los repositorios que NO quieres mostrar en tu portafolio
const EXCLUDED_REPOS = [
  'Bernal-XFK', // Usualmente el repositorio del README de perfil
  'Portfolio'   // Puedes excluir el código fuente de tu portafolio si lo deseas
];

function formatTitle(name: string) {
  // Convierte "mi-proyecto-web" a "Mi Proyecto Web"
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Solo se permiten peticiones GET' });
  }

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Portfolio-App'
    };

    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=100`, 
      { headers }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json();

    const projects = repos
      .filter((repo: any) => !repo.fork && !EXCLUDED_REPOS.includes(repo.name))
      .map((repo: any) => {
        const title = formatTitle(repo.name);
        const description = repo.description || generateFallbackDescription(repo.name, repo.language, repo.topics);
        
        // Estrategia de imagen: Buscamos cover.png en la rama principal. 
        // Si falla en el frontend, usaremos la imagen generada por GitHub (OpenGraph)
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
          tech: Array.from(new Set(tech)).slice(0, 4), // Máximo 4 tecnologías para que no desborde
          stars: repo.stargazers_count || 0
        };
      });

    // Cache por 1 hora (evita quemar la API de GitHub en Vercel)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(projects);
  } catch (error: any) {
    console.error("GitHub Fetch Error:", error);
    
    return res.status(500).json({ 
      error: "Error al conectar con GitHub.",
      details: error.message
    });
  }
}
