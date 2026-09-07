// Genera public/cv.pdf con pdfkit (xref/Length/escaping/WinAnsi correctos).
// Uso: node scripts/generate-cv-pdf.mjs
import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(here, '..', 'public', 'cv.pdf');

const NAVY = '#1e3a5f';
const INK = '#1f2937';
const MUTED = '#4b5563';
const LIGHT_MUTED = '#6b7280';
const RULE = '#cbd5e1';
const YEAR = new Date().getFullYear();

function sectionTitle(doc, title) {
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY).text(title.toUpperCase(), { characterSpacing: 0.6 });
  const y = doc.y + 3;
  doc.strokeColor(RULE).lineWidth(1).moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
  doc.moveDown(0.5);
}

function bullet(doc, label, body) {
  const x = doc.page.margins.left;
  doc.font('Helvetica').fontSize(9.4).fillColor(INK);
  if (label) {
    doc.font('Helvetica-Bold').fillColor(INK).text('\u2022  ' + label, x, doc.y, { continued: body ? true : false, lineGap: 2 });
    if (body) doc.font('Helvetica').fillColor(MUTED).text(' ' + body, { lineGap: 2 });
  } else {
    doc.text('\u2022  ' + body, { lineGap: 2 });
  }
  doc.moveDown(0.15);
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 0, bottom: 48, left: 48, right: 48 },
  info: {
    Title: 'Jose Bernal — CV | Ingenieria de Sistemas (CESMAG)',
    Author: 'Jose Alejandro Bernal Figueroa',
    Subject: 'Hoja de vida — Frontend / Backend / Data',
    Keywords: 'CV, Jose Bernal, Ingenieria de Sistemas, CESMAG, React, TypeScript, Java, Python',
    Creator: 'Creative Portfolio — scripts/generate-cv-pdf.mjs (pdfkit)',
    Producer: 'pdfkit',
  },
});

const out = fs.createWriteStream(outPath);
doc.pipe(out);
doc.on('error', (err) => { console.error(err); process.exit(1); });

// ---------- Header band ----------
const W = doc.page.width;
doc.save();
doc.rect(0, 0, W, 168).fill(NAVY);
doc.restore();

doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21).text('Jose Alejandro Bernal Figueroa', 48, 30, { align: 'center', width: W - 96 });
doc.fillColor('#dbeafe').font('Helvetica').fontSize(10).text('Estudiante de Ingenieria de Sistemas  |  9no semestre (CESMAG)  |  20 anos', { align: 'center' });
doc.moveDown(0.4);
doc.fillColor('#bfdbfe').font('Helvetica').fontSize(8.6).text('Colombia  |  Portafolio: Jose Bernal - Creative Portfolio', { align: 'center' });

// Contacto (centrado, seleccionable y clicable)
doc.moveDown(0.5);
const contactY = doc.y;
doc.fillColor('#ffffff').font('Helvetica').fontSize(8.8);
const c1 = 'jabernal.4395@unicesmag.edu.co';
const c2 = 'github.com/Bernal-XFK';
const c3 = 'Instagram: @alejandro_bernalx';
const c4 = '323 489 3219';
doc.text(`${c1}   |   ${c2}   |   ${c3}   |   ${c4}`, 48, contactY, { align: 'center', width: W - 96 });
// Links clicables sobre email y GitHub (misma linea centrada)
try {
  const line = `${c1}   |   ${c2}   |   ${c3}   |   ${c4}`;
  const fullW = doc.widthOfString(line);
  let cx = (W - fullW) / 2;
  const cy = contactY;
  const h = 11;
  const w1 = doc.widthOfString(c1);
  doc.link(cx, cy, w1, h, `mailto:${c1}`);
  cx += w1 + doc.widthOfString('   |   ');
  const w2 = doc.widthOfString(c2);
  doc.link(cx, cy, w2, h, 'https://github.com/Bernal-XFK');
} catch { /* links decorativos: el texto sigue seleccionable */ }

// ---------- Body (flujo lineal: 1 sola pagina) ----------
doc.y = 184;
doc.fillColor(INK);

// Perfil
sectionTitle(doc, 'Perfil profesional');
doc.font('Helvetica').fontSize(9.2).fillColor(MUTED).text(
  'Estudiante de Ingenieria de Sistemas (9no semestre, Universidad CESMAG) con interes en desarrollo de software y tecnologias de la informacion. Experiencia en proyectos academicos de programacion, consumo de APIs REST y desarrollo frontend con React y TypeScript. Me destaco por aprendizaje rapido, responsabilidad y enfoque en resolver problemas con herramientas tecnologicas.',
  { align: 'justify', lineGap: 2 }
);

// Formacion
sectionTitle(doc, 'Formacion academica');
doc.font('Helvetica-Bold').fontSize(9.4).fillColor(INK).text('Ingenieria de Sistemas — Universidad CESMAG');
doc.font('Helvetica-Oblique').fontSize(8.8).fillColor(LIGHT_MUTED).text('9no semestre  |  En curso  |  Colombia');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Enfasis: desarrollo de software, programacion y consumo de APIs.', { lineGap: 1 });

// Skills
sectionTitle(doc, 'Habilidades tecnicas');
bullet(doc, 'Frontend:', 'React / Next.js, TypeScript, Tailwind CSS, Framer Motion, diseno UI/UX, Vite.');
bullet(doc, 'Backend / Data:', 'Java, Python, Node.js + Express, consumo de APIs REST (JSON), logica de programacion.');
bullet(doc, 'Herramientas:', 'Git y GitHub, npm, Vercel, VS Code, Postman.');

// Proyectos
sectionTitle(doc, 'Proyectos destacados');
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('1. Gestion de Posts con API REST (Java Swing + JSONPlaceholder)');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('App de escritorio en Java Swing con CRUD contra JSONPlaceholder. HTTP, JSON y estados de carga/error.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('2. Creative Portfolio (este portafolio)');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('React 19 + TypeScript + Vite + Tailwind: Hero, Proyectos via GitHub API, Skills, CV y Contacto. Covers SVG locales y fallback OpenGraph.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('3. WaveMood — experiencia frontend interactiva');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('UI con animaciones y componentes reutilizables. Responsive, accesibilidad y detalle visual.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('4. Repositorios en GitHub — github.com/Bernal-XFK');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Codigo y practicas en Java / Python / JS. Ver perfil para el listado completo.', { link: 'https://github.com/Bernal-XFK', lineGap: 1 });

// Blandas / idiomas / adicional (una sola columna, compacto)
sectionTitle(doc, 'Habilidades blandas  |  Idiomas  |  Info adicional');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Blandas: pensamiento logico, trabajo en equipo, adaptabilidad, responsabilidad.', { lineGap: 1 });
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Idiomas: espanol nativo | ingles B1 (lectura tecnica).', { lineGap: 1 });
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Adicional: disponibilidad para aprendizaje continuo e interes en desarrollo de software.', { lineGap: 1 });
doc.moveDown(0.4);

// Footer en flujo (sin coordenadas absolutas: evita paginas extra)
doc.strokeColor(RULE).lineWidth(0.7).moveTo(48, doc.y).lineTo(W - 48, doc.y).stroke();
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(7.5).fillColor(LIGHT_MUTED).text(`CV — Jose Bernal | Creative Portfolio • ${YEAR}   |   github.com/Bernal-XFK`, { align: 'center', link: 'https://github.com/Bernal-XFK' });

doc.end();

await new Promise((res, rej) => {
  out.on('finish', res);
  out.on('error', rej);
});
console.log('OK ->', outPath, fs.statSync(outPath).size + ' bytes');
