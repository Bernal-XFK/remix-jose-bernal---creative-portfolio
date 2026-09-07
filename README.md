<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Creative Portfolio — Jose Bernal

Portafolio SPA (React + Vite + Tailwind v4 + motion) con API de proyectos vía GitHub (`/api/projects`, `server.ts`).

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Opcional) Copia `.env.example` a `.env.local` y define `GITHUB_TOKEN` con un Personal Access Token
   para evitar el rate limit de la API pública de GitHub. Sin token la app funciona, pero con muchas
   recargas GitHub puede devolver 403. Crea el token en https://github.com/settings/tokens.
3. Run the app:
   `npm run dev`
4. Build:
   `npm run build`
