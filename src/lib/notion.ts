/**
 * Notion Integration Guide
 * 
 * En un entorno real (como Next.js con Server Components o API Routes), 
 * usarías el SDK oficial de Notion para obtener los proyectos.
 * 
 * 1. Instalar: npm install @notionhq/client
 * 2. Configurar variables de entorno (.env):
 *    NOTION_API_KEY=secret_...
 *    NOTION_DATABASE_ID=...
 * 
 * 3. Estructura de la base de datos en Notion:
 *    - title: Title (Nombre del proyecto)
 *    - description: Rich Text (Descripción corta)
 *    - tech: Multi-select (Tecnologías usadas)
 *    - github: URL (Link al repo)
 *    - demo: URL (Link al proyecto en vivo)
 *    - image: Files & media (Imagen principal)
 *    - color: Select (Color de acento, ej: #f27d26)
 *    - order: Number (Para ordenar)
 *    - published: Checkbox (Para filtrar)
 */

// Ejemplo de código para Next.js / Backend:
/*
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function getProjects() {
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  if (!databaseId) throw new Error('Missing Notion Database ID');

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'published',
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: 'order',
        direction: 'ascending',
      },
    ],
  });

  return response.results.map((page: any) => {
    return {
      id: page.id,
      title: page.properties.title.title[0]?.plain_text || 'Untitled',
      description: page.properties.description.rich_text[0]?.plain_text || '',
      tech: page.properties.tech.multi_select.map((t: any) => t.name),
      github: page.properties.github.url || '#',
      demo: page.properties.demo.url || '#',
      image: page.properties.image.files[0]?.file?.url || page.properties.image.files[0]?.external?.url || '',
      color: page.properties.color.select?.name || '#ffffff',
    };
  });
}
*/

// Para este demo (SPA), usamos datos mockeados en el componente Projects.tsx
export const getProjectsMock = async () => {
  return [
    {
      id: '1',
      title: 'E-Commerce Analytics Dashboard',
      description: 'Plataforma de análisis de datos en tiempo real para tiendas online, construida con React y D3.js.',
      tech: ['React', 'TypeScript', 'Tailwind', 'D3.js', 'Node.js'],
      github: '#',
      demo: '#',
      image: 'https://picsum.photos/seed/dashboard/800/600',
      color: '#f27d26'
    },
    // ...
  ];
};
