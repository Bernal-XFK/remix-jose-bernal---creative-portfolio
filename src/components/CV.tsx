import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

export default function CV() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="cv" className="py-32 relative bg-black" ref={ref}>
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          className="glass rounded-3xl p-8 md:p-16 border border-white/10 relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
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
                Mi Trayectoria <br />
                <span className="text-white/50 italic font-light">Profesional</span>
              </h2>
              
              <p className="text-white/60 mb-10 font-light leading-relaxed">
                Descubre mi historial académico, proyectos destacados y experiencia laboral en el mundo del desarrollo y análisis de datos.
              </p>

              <motion.a
                href="/cv.pdf"
                download
                className="inline-flex items-center justify-center px-8 py-4 font-bold text-black transition-all duration-300 bg-white rounded-full hover:bg-white/90 hover:scale-105 active:scale-95 hover-trigger group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Descargar CV
                <svg
                  className="w-5 h-5 ml-2 -mr-1 transition-transform duration-300 group-hover:translate-y-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </motion.a>
            </div>

            <div className="relative">
              {/* CV Preview Mockup */}
              <motion.div
                className="w-full aspect-[3/4] bg-white text-black rounded-2xl p-4 md:p-6 shadow-2xl overflow-y-auto relative text-left text-[10px] md:text-xs font-sans scrollbar-hide"
                initial={{ rotate: 5, x: 50, opacity: 0 }}
                animate={isInView ? { rotate: -2, x: 0, opacity: 1 } : {}}
                transition={{ duration: 1, delay: 0.3, type: 'spring' }}
                whileHover={{ rotate: 0, scale: 1.02 }}
              >
                {/* Header */}
                <div className="bg-[#1e3a5f] text-white p-4 -m-4 md:-m-6 mb-4 md:mb-6 text-center">
                  <h3 className="text-lg md:text-xl font-bold mb-1">José Alejandro Bernal Figueroa</h3>
                  <p className="text-[10px] md:text-xs opacity-90 mb-2">Estudiante de Ingeniería de Sistemas | 20 años</p>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-[8px] md:text-[10px] opacity-80">
                    <span>📞 323 489 3219</span>
                    <span>✉️ jabernal.4395@unicesmag.edu.co</span>
                    <span>🌐 github.com/Bernal-XFK</span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Perfil Profesional</h4>
                    <p className="text-gray-700 leading-relaxed text-[9px] md:text-[11px]">
                      Estudiante de Ingeniería de Sistemas con interés en el desarrollo de software y tecnologías de la información. Cuento con experiencia en proyectos académicos relacionados con programación y consumo de APIs. Me destaco por mi capacidad de aprendizaje, responsabilidad y enfoque en la solución de problemas mediante herramientas tecnológicas.
                    </p>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Formación Académica</h4>
                    <div className="text-[9px] md:text-[11px]">
                      <p className="font-bold text-gray-800">Ingeniería de Sistemas — Universidad CESMAG</p>
                      <p className="text-gray-600 italic">9no semestre | En curso</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Habilidades Técnicas</h4>
                    <div className="grid grid-cols-2 gap-2 text-gray-700 bg-gray-50 p-2 border border-gray-200 text-[9px] md:text-[11px]">
                      <ul className="list-disc list-inside">
                        <li>Java, Python, TypeScript</li>
                        <li>Desarrollo de apps de escritorio</li>
                      </ul>
                      <ul className="list-disc list-inside">
                        <li>Consumo de APIs REST</li>
                        <li>Manejo de Git y GitHub</li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[#1e3a5f] font-bold border-b border-[#1e3a5f] pb-1 mb-2 uppercase text-[10px] md:text-xs">Proyectos Destacados</h4>
                    <div className="mb-2 text-[9px] md:text-[11px]">
                      <p className="font-bold text-[#1e3a5f]">Gestión de posts con API (JSONPlaceholder)</p>
                      <p className="text-gray-700">Desarrollo de aplicación en Java Swing para consumo y gestión de datos desde una API REST. Implementa operaciones CRUD conectadas al endpoint público JSONPlaceholder.</p>
                    </div>
                    <div className="text-[9px] md:text-[11px]">
                      <p className="font-bold text-[#1e3a5f]">Repositorios en GitHub</p>
                      <p className="text-gray-700">github.com/Bernal-XFK</p>
                    </div>
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
                        <li>Disponibilidad para aprendizaje continuo</li>
                        <li>Interés en desarrollo de software</li>
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
