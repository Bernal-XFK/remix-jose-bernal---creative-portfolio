import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { SplitChars, Reveal } from './motion-shared';

export const CV_PDF_URL = '/cv.pdf';
export const CV_FILE_NAME = 'Jose-Bernal-CV.pdf';

async function cvAvailable(): Promise<boolean> {
  try {
    const res = await fetch(CV_PDF_URL, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function handleViewCV(e: ReactMouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  if (await cvAvailable()) {
    window.open(CV_PDF_URL, '_blank', 'noopener,noreferrer');
  } else {
    window.print();
  }
}

async function handleDownloadCV(e: ReactMouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  if (await cvAvailable()) {
    const a = document.createElement('a');
    a.href = CV_PDF_URL;
    a.download = CV_FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.print();
  }
}

export default function CV() {
  const ref = useRef(null);
  const reduce = useReducedMotion() === true;
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const cardY = useTransform(scrollYProgress, [0, 1], [36, -36]);

  return (
    <section id="cv" className="py-32 relative bg-black" ref={ref}>
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          className="glass rounded-3xl p-8 md:p-16 border border-white/10 relative overflow-hidden"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={reduce ? undefined : { y: cardY }}
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-[1px] bg-primary" />
                <span className="font-mono text-primary text-sm uppercase tracking-widest">Experiencia</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <SplitChars text="Mi Trayectoria" mode="scroll" />
                <br />
                <span className="text-white/50 italic font-light">
                  <SplitChars text="Profesional" mode="scroll" delay={0.12} />
                </span>
              </h2>

              <Reveal delay={0.1}>
              <p className="text-white/60 mb-10 font-light leading-relaxed">
                Descubre mi historial académico, proyectos destacados y experiencia laboral en el mundo del desarrollo y análisis de datos.
              </p>
              </Reveal>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a
                  href={CV_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleViewCV}
                  aria-label="Ver CV en nueva pestaña (PDF)"
                  className="inline-flex items-center justify-center px-8 py-4 font-bold text-black transition-all duration-300 bg-white rounded-full hover:bg-white/90 hover:scale-105 active:scale-95 hover-trigger group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  whileHover={reduce ? undefined : { scale: 1.02, boxShadow: '0 8px 32px rgba(255,255,255,0.25)' }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  Ver CV
                  <svg
                    className="w-5 h-5 ml-2 -mr-1 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </motion.a>
                <motion.a
                  href={CV_PDF_URL}
                  download={CV_FILE_NAME}
                  onClick={handleDownloadCV}
                  aria-label="Descargar CV en PDF"
                  className="inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-white/5 border border-white/15 rounded-full backdrop-blur-sm hover:bg-white/10 hover:border-white/30 hover:scale-105 active:scale-95 hover-trigger group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  whileHover={reduce ? undefined : { scale: 1.02, boxShadow: '0 8px 32px rgba(242,125,38,0.22)' }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                >
                  Descargar CV
                  <svg
                    className="w-5 h-5 ml-2 -mr-1 transition-transform duration-300 group-hover:translate-y-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </motion.a>
              </div>
              <p className="mt-4 font-mono text-xs text-white/40">
                PDF actualizado — si falla la descarga,{' '}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="underline underline-offset-2 hover:text-white/70 transition-colors hover-trigger"
                >
                  usa Imprimir / Guardar como PDF
                </button>
                .
              </p>
            </div>

            <div className="relative">
              {/* CV Preview Mockup */}
              <motion.div
                className="w-full aspect-[3/4] bg-white text-black rounded-2xl p-4 md:p-6 shadow-2xl overflow-y-auto relative text-left text-[10px] md:text-xs font-sans scrollbar-hide"
                initial={reduce ? false : { rotate: 5, x: 40, opacity: 0 }}
                animate={isInView ? { rotate: -2, x: 0, opacity: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.25, type: 'spring', stiffness: 60, damping: 20 }}
                whileHover={reduce ? undefined : { rotate: 0, scale: 1.02 }}
              >
                {/* Header */}
                <div className="bg-[#1e3a5f] text-white p-4 -m-4 md:-m-6 mb-4 md:mb-6 text-center">
                  <h3 className="text-lg md:text-xl font-bold mb-1">José Alejandro Bernal Figueroa</h3>
                  <p className="text-[10px] md:text-xs opacity-90 mb-2">Ing. de Sistemas · 10° semestre (CESMAG) | Estudiante de Big Data</p>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-[8px] md:text-[10px] opacity-80">
                    <span>📞 323 489 3219</span>
                    <span>✉️ bernaljosehgt@gmail.com</span>
                    <span>🌐 github.com/Bernal-XFK</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Perfil Profesional</h4>
                    <p className="text-gray-700 leading-relaxed text-[9px] md:text-[11px]">
                      Estudiante de Ingeniería de Sistemas (10° semestre, CESMAG) y estudiante de Big Data, con intereses en desarrollo frontend y backend y análisis de datos. Experiencia en proyectos académicos de programación, consumo de APIs REST y React + TypeScript, además de fundamentos de Python para datos.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Formación Académica</h4>
                    <div className="text-[9px] md:text-[11px] space-y-1">
                      <p className="font-bold text-gray-800">Ingeniería de Sistemas — Universidad CESMAG</p>
                      <p className="text-gray-600 italic">10° semestre | En curso | Pasto, Nariño</p>
                      <p className="text-gray-700">Big Data (estudiante) · Bachiller San Felipe Neri (2021) · Técnico SENA Multimedia (2021) · Cursos SENA / Cisco</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Habilidades Técnicas</h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-700 bg-gray-50 p-2 border border-gray-200 text-[9px] md:text-[11px]">
                      <ul className="list-disc list-inside">
                        <li>Frontend: React, TS, Tailwind</li>
                        <li>Backend: Node, Java, Python</li>
                      </ul>
                      <ul className="list-disc list-inside">
                        <li>Datos: Python, Big Data, JSON</li>
                        <li>Git, GitHub, Vercel, Postman</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Proyectos Destacados</h4>
                    <div className="mb-2 text-[9px] md:text-[11px]">
                      <p className="font-bold text-[#1e3a5f]">Gestión de posts con API (JSONPlaceholder)</p>
                      <p className="text-gray-700">App Java Swing con CRUD contra API REST. HTTP, JSON y estados de carga/error.</p>
                    </div>
                    <div className="mb-2 text-[9px] md:text-[11px]">
                      <p className="font-bold text-[#1e3a5f]">Creative Portfolio + WaveMood</p>
                      <p className="text-gray-700">React 19 + TS + Tailwind. UI interactiva, responsive y accesible.</p>
                    </div>
                    <div className="text-[9px] md:text-[11px]">
                      <p className="font-bold text-[#1e3a5f]">GitHub — github.com/Bernal-XFK</p>
                      <p className="text-gray-700">Prácticas en Java / Python / JS y datos.</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Experiencia</h4>
                    <p className="font-bold text-gray-800 text-[9px] md:text-[11px]">KOAJ — Atención al cliente (4 meses)</p>
                    <p className="text-gray-700 text-[9px] md:text-[11px]">Ventas, trabajo en equipo y responsabilidad. Pasto, Nariño.</p>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Habilidades Blandas</h4>
                    <div className="grid grid-cols-2 gap-1 text-gray-700 text-[9px] md:text-[11px]">
                      <p>✔ Pensamiento lógico y analítico</p>
                      <p>✔ Trabajo en equipo</p>
                      <p>✔ Adaptabilidad</p>
                      <p>✔ Responsabilidad</p>
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-4">
                    <section>
                      <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Idiomas</h4>
                      <p className="text-gray-700 text-[9px] md:text-[11px]"><span className="font-bold">Español:</span> Nativo</p>
                      <p className="text-gray-700 text-[9px] md:text-[11px]"><span className="font-bold">Inglés:</span> Nivel B1</p>
                    </section>

                    <section>
                      <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Info Adicional</h4>
                      <ul className="list-disc list-inside text-gray-700 text-[9px] md:text-[11px]">
                        <li>Aprendizaje continuo</li>
                        <li>Front · Back · Data analysis</li>
                      </ul>
                    </section>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
