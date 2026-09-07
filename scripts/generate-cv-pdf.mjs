// Genera public/cv.pdf — CV PROFESIONAL PÚBLICO (1-2 páginas, pdfkit).
// Uso: node scripts/generate-cv-pdf.mjs
// SEGURIDAD: solo datos públicos. NO incluir cédula, dirección exacta,
// datos familiares, EPS, banco ni firma.
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

function eduItem(doc, title, meta, desc) {
  doc.font('Helvetica-Bold').fontSize(9.4).fillColor(INK).text(title, { lineGap: 1 });
  doc.font('Helvetica-Oblique').fontSize(8.8).fillColor(LIGHT_MUTED).text(meta, { lineGap: 1 });
  if (desc) doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text(desc, { lineGap: 1 });
  doc.moveDown(0.25);
}

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 0, bottom: 48, left: 48, right: 48 },
  info: {
    Title: 'Jose Alejandro Bernal Figueroa — CV | Ing. de Sistemas 10mo semestre + Big Data',
    Author: 'Jose Alejandro Bernal Figueroa',
    Subject: 'Hoja de vida pública — Frontend / Backend / Análisis de datos',
    Keywords: 'CV, Jose Bernal, Ingenieria de Sistemas, CESMAG, Big Data, React, TypeScript, Python',
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
doc.fillColor('#dbeafe').font('Helvetica').fontSize(10).text('Ingenieria de Sistemas  |  10mo semestre (CESMAG)  |  Estudiante de Big Data', { align: 'center' });
doc.moveDown(0.4);
doc.fillColor('#bfdbfe').font('Helvetica').fontSize(8.6).text('Frontend  ·  Backend  ·  Analisis de datos  |  Pasto, Narino (Colombia)', { align: 'center' });

// Contacto público (centrado, seleccionable y clicable)
doc.moveDown(0.5);
const contactY = doc.y;
doc.fillColor('#ffffff').font('Helvetica').fontSize(8.8);
const c1 = 'bernaljosehgt@gmail.com';
const c2 = 'github.com/Bernal-XFK';
const c3 = 'IG: @alejandro_bernalx';
const c4 = '323 489 3219';
doc.text(`${c1}   |   ${c2}   |   ${c3}   |   ${c4}`, 48, contactY, { align: 'center', width: W - 96 });
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

// ---------- Body ----------
doc.y = 184;
doc.fillColor(INK);

// Perfil
sectionTitle(doc, 'Perfil profesional');
doc.font('Helvetica').fontSize(9.2).fillColor(MUTED).text(
  'Estudiante de Ingenieria de Sistemas (10mo semestre, Universidad CESMAG) y estudiante de Big Data, con intereses en desarrollo frontend y backend y analisis de datos. Experiencia en proyectos academicos de programacion, consumo de APIs REST y desarrollo frontend con React y TypeScript, ademas de fundamentos de Python para datos. Me destaco por aprendizaje rapido, responsabilidad y enfoque en resolver problemas con tecnologia.',
  { align: 'justify', lineGap: 2 }
);

// Formación
sectionTitle(doc, 'Formacion academica');
eduItem(doc, 'Ingenieria de Sistemas — Universidad CESMAG', '10mo semestre  |  En curso  |  Pasto, Narino', 'Enfasis: desarrollo de software (frontend y backend) y analisis de datos.');
eduItem(doc, 'Formacion en Big Data — Analisis de datos', 'Estudiante  |  En curso', 'Interes en analisis de datos, Python y fundamentos de Big Data.');
eduItem(doc, 'Bachiller Academico — Colegio San Felipe Neri', '2021  |  Pasto, Narino', null);
eduItem(doc, 'Tecnico en Integracion de Contenidos Digitales (Multimedia) — SENA', '2021', null);
eduItem(doc, 'Cursos complementarios — SENA / Cisco', 'Formacion continua en TI', 'Cursos cortos en programacion, redes y tecnologias de la informacion.');

// Skills
sectionTitle(doc, 'Habilidades tecnicas');
bullet(doc, 'Frontend:', 'React / Next.js, TypeScript, Tailwind CSS, Vite, Framer Motion, diseno UI/UX.');
bullet(doc, 'Backend:', 'Node.js + Express, Java, Python, APIs REST (JSON), logica de programacion.');
bullet(doc, 'Datos:', 'Python para analisis, fundamentos de Big Data, manejo de JSON y consumo de datos.');
bullet(doc, 'Herramientas:', 'Git y GitHub, npm, Vercel, VS Code, Postman.');

// Proyectos
sectionTitle(doc, 'Proyectos destacados');
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('1. Gestion de Posts con API REST (Java Swing + JSONPlaceholder)');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('App de escritorio en Java Swing con CRUD contra JSONPlaceholder. HTTP, JSON y estados de carga/error.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('2. Creative Portfolio (este portafolio)');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('React 19 + TypeScript + Vite + Tailwind: Hero, Proyectos via GitHub API, Skills, CV y Contacto.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('3. WaveMood — experiencia frontend interactiva');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('UI con animaciones y componentes reutilizables. Responsive, accesibilidad y detalle visual.', { lineGap: 1 });
doc.moveDown(0.2);
doc.font('Helvetica-Bold').fontSize(9.2).fillColor(NAVY).text('4. Repositorios en GitHub — github.com/Bernal-XFK');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Codigo y practicas en Java / Python / JS y ejercicios de datos. Ver perfil para el listado completo.', { link: 'https://github.com/Bernal-XFK', lineGap: 1 });

// Experiencia
sectionTitle(doc, 'Experiencia');
doc.font('Helvetica-Bold').fontSize(9.4).fillColor(INK).text('Asesor de ventas / Atencion al cliente — KOAJ');
doc.font('Helvetica-Oblique').fontSize(8.8).fillColor(LIGHT_MUTED).text('4 meses  |  Pasto, Narino');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Atencion al cliente, apoyo en ventas, trabajo en equipo, comunicacion y responsabilidad.', { lineGap: 1 });

// Blandas / idiomas / adicional
sectionTitle(doc, 'Habilidades blandas  |  Idiomas  |  Info adicional');
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Blandas: pensamiento logico, trabajo en equipo, adaptabilidad, responsabilidad.', { lineGap: 1 });
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Idiomas: espanol nativo | ingles B1 (lectura tecnica).', { lineGap: 1 });
doc.font('Helvetica').fontSize(8.8).fillColor(MUTED).text('Adicional: disponibilidad para aprendizaje continuo; interes en desarrollo frontend, backend y analisis de datos.', { lineGap: 1 });
doc.moveDown(0.4);

// Footer en flujo (sin coordenadas absolutas: evita paginas extra)
doc.strokeColor(RULE).lineWidth(0.7).moveTo(48, doc.y).lineTo(W - 48, doc.y).stroke();
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(7.5).fillColor(LIGHT_MUTED).text(`CV publico — Jose Bernal | Pasto, Narino • ${YEAR}   |   github.com/Bernal-XFK`, { align: 'center', link: 'https://github.com/Bernal-XFK' });

doc.end();

await new Promise((res, rej) => {
  out.on('finish', res);
  out.on('error', rej);
});
console.log('OK ->', outPath, fs.statSync(outPath).size + ' bytes');
