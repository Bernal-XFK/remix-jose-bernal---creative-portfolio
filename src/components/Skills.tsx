import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import ArcadeMinigame from './ArcadeMinigame';
import { SplitChars, Stagger, StaggerItem } from './motion-shared';

const skills = [
  { name: 'React / Next.js', level: 90, color: '#f27d26' },
  { name: 'TypeScript', level: 85, color: '#00ffcc' },
  { name: 'Tailwind CSS', level: 95, color: '#8b5cf6' },
  { name: 'Framer Motion', level: 80, color: '#f27d26' },
  { name: 'Python / Big Data', level: 75, color: '#00ffcc' },
  { name: 'UI/UX Design', level: 85, color: '#8b5cf6' },
];

/* Sistema orbital — solo tokens del portfolio.
   #f27d26 primary · #00ffcc accent · #8b5cf6 (secondary #4a00e0 elevado
   para legibilidad sobre #050505, misma familia violeta).
   Core fijo estilo sol + 3 órbitas lineales infinitas (12s/22s/36s).
   Planeta en borde de órbita con counter-rotate para no girar sobre
   sí mismo + satélite opuesto (180°) que también orbita.
   Solo transform/rotate/opacity — 60fps, will-change-transform. */
const ORBITS = [
  { size: 180, duration: 12, color: '#00ffcc', rgb: '0, 255, 204', planet: 12, tilt: 64, skew: 0, dir: 1 },
  { size: 252, duration: 22, color: '#f27d26', rgb: '242, 125, 38', planet: 16, tilt: 68, skew: 10, dir: -1 },
  { size: 322, duration: 36, color: '#8b5cf6', rgb: '139, 92, 246', planet: 10, tilt: 71, skew: -8, dir: 1 },
];

export default function Skills() {
  const ref = useRef(null);
  const reduce = useReducedMotion() === true;
  const [showGame, setShowGame] = useState(false);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="py-32 relative overflow-hidden bg-background" ref={ref}>
      {/* Decorative Background — anillos discontinuos sutiles, visibles al rotar */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-60">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-dashed border-white/[0.07] rounded-full animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-dashed border-white/[0.07] rounded-full animate-spin-slow-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(74,0,224,0.10),transparent_65%)] blur-2xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-4 mb-4"
          >
            <div className="w-8 h-[1px] bg-primary" />
            <span className="font-mono text-primary text-sm uppercase tracking-widest">Habilidades</span>
            <div className="w-8 h-[1px] bg-primary" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-display font-bold">
            <SplitChars text="Arsenal" mode="scroll" />{' '}
            <span className="text-gradient">
              <SplitChars text="Tecnológico" mode="scroll" delay={0.12} />
            </span>
          </h2>
        </div>

        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-32" delay={0.15}>
          {skills.map((skill) => (
            <StaggerItem key={skill.name}>
              <motion.div
                className="relative rounded-2xl p-1"
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              >
                <div className="flex justify-between mb-2 font-mono text-sm">
                  <span className="text-white/80">{skill.name}</span>
                  <span className="text-white/40">{skill.level}%</span>
                </div>

                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                  {/* Barra por transform (scaleX) — 60fps, sin animar width */}
                  <motion.div
                    className="absolute inset-0 origin-left rounded-full will-change-transform"
                    style={{
                      background: `linear-gradient(90deg, ${skill.color}, rgba(255,255,255,0.55) 130%)`,
                      boxShadow: `0 0 16px ${skill.color}55`,
                    }}
                    initial={reduce ? false : { scaleX: 0 }}
                    animate={isInView ? { scaleX: skill.level / 100 } : {}}
                    transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Interactive Planets & Arcade Section */}
        <div className="mt-20 relative min-h-[320px] md:min-h-[360px] h-auto py-4 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">

          {/* Orbital Visualization — galaxia primary/accent/secondary */}
          <div
            className="relative w-[300px] h-[300px] md:w-[340px] md:h-[340px] shrink-0 flex items-center justify-center"
            style={{ perspective: '1000px' }}
          >
            {/* Halo exterior — fallback CSS puro (galaxy-halo-pulse 3s).
                No depende de framer-motion: visible incluso con reduced-motion
                on (allí se ralentiza a 6s, no se congela). */}
            <div
              aria-hidden="true"
              className="galaxy-halo-pulse absolute inset-0 m-auto w-44 h-44 rounded-full will-change-transform"
              style={{
                background:
                  'radial-gradient(circle, rgba(242,125,38,0.50) 0%, rgba(74,0,224,0.28) 52%, transparent 70%)',
                filter: 'blur(26px)',
              }}
            />
            {/* Core — SOL central: vidrio oscuro + borde primary, glow cálido.
                Respira vía CSS (galaxy-core-pulse 3s, scale 1→1.08); no rota.
                Solo transform — 60fps. No se gatea por reduced-motion: el CSS
                lo ralentiza a 6s en ese modo en vez de congelarlo. */}
            <div
              className="galaxy-core-pulse relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1.5 bg-[#0b0b10] border font-mono will-change-transform"
              style={{
                borderColor: 'rgba(242,125,38,0.55)',
                boxShadow:
                  '0 0 24px rgba(242,125,38,0.55), 0 0 64px rgba(242,125,38,0.30), 0 0 96px rgba(0,255,204,0.10), inset 0 0 22px rgba(242,125,38,0.30)',
              }}
            >
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff, #f27d26 55%, #4a00e0 130%)',
                  boxShadow: '0 0 10px rgba(242,125,38,0.9), 0 0 22px rgba(0,255,204,0.35)',
                }}
              />
              <span className="text-[10px] font-bold tracking-[0.3em] text-white/90 font-display pl-[0.3em]">
                CORE
              </span>
            </div>
            {/* Halo discontinuo pegado al core — orbita vía CSS (30s lineal).
                No se gatea por reduced-motion: allí va a 90s, no estático. */}
            <div
              aria-hidden="true"
              className="galaxy-spin-slow absolute inset-0 m-auto z-0 w-28 h-28 rounded-full border border-dashed border-white/10 will-change-transform"
            />

            {/* Órbitas reales — tilt 3D (rotateX) = elipse leve, giro solo transform.
                Anillo rota vía CSS (12s/22s/36s); planeta + satélite opuesto
                orbitan como hijos del anillo, con counter-rotate CSS para no
                girar sobre sí. Nada depende de framer-motion: funciona incluso
                con reduced-motion on (allí a 60s lento) o si el JS falla. */}
            {ORBITS.map((orbit) => (
              <div
                key={orbit.size}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `rotateX(${orbit.tilt}deg) rotateZ(${orbit.skew}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className={`relative rounded-full border border-dashed border-white/10 will-change-transform ${
                    orbit.dir === 1 ? 'galaxy-orbit' : 'galaxy-orbit-reverse'
                  }`}
                  style={{
                    width: `${orbit.size}px`,
                    height: `${orbit.size}px`,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                    ['--orbit-duration' as string]: `${orbit.duration}s`,
                  }}
                >
                  {/* Planeta sobre el borde del anillo (top = 0°) */}
                  <div
                    className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                    style={{ width: `${orbit.planet}px`, height: `${orbit.planet}px` }}
                  >
                    {/* Counter-rotate: compensa el giro del anillo para que el
                        planeta no gire sobre sí mismo (iconos siempre rectos). */}
                    <div
                      className={`relative w-full h-full will-change-transform ${
                        orbit.dir === 1 ? 'galaxy-orbit-reverse' : 'galaxy-orbit'
                      }`}
                      style={{
                        willChange: 'transform',
                        ['--orbit-duration' as string]: `${orbit.duration}s`,
                      }}
                    >
                      {/* Glow coherente — estático, no se anima */}
                      <div
                        className="absolute -inset-2 rounded-full"
                        style={{ background: orbit.color, opacity: 0.35, filter: 'blur(8px)' }}
                      />
                      <div
                        className="relative w-full h-full rounded-full border border-white/25"
                        style={{
                          background: `radial-gradient(circle at 32% 30%, #ffffff 0%, ${orbit.color} 48%, #050505 135%)`,
                          boxShadow: `0 0 12px rgba(${orbit.rgb},0.55), 0 0 28px rgba(${orbit.rgb},0.25)`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Satélite compañero — 180° opuesto (bottom), también orbita
                      con el anillo + counter-rotate propio. Nada queda estático. */}
                  <div
                    className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2"
                    style={{
                      width: `${Math.max(6, Math.round(orbit.planet * 0.55))}px`,
                      height: `${Math.max(6, Math.round(orbit.planet * 0.55))}px`,
                    }}
                  >
                    <div
                      className={`relative w-full h-full will-change-transform ${
                        orbit.dir === 1 ? 'galaxy-orbit-reverse' : 'galaxy-orbit'
                      }`}
                      style={{
                        willChange: 'transform',
                        ['--orbit-duration' as string]: `${orbit.duration}s`,
                      }}
                    >
                      <div
                        className="absolute -inset-1.5 rounded-full"
                        style={{ background: orbit.color, opacity: 0.3, filter: 'blur(6px)' }}
                      />
                      <div
                        className="relative w-full h-full rounded-full border border-white/25"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${orbit.color} 55%, #050505 140%)`,
                          boxShadow: `0 0 8px rgba(${orbit.rgb},0.5)`,
                          opacity: 0.9,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arcade Mini Game Trigger */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center md:items-start text-center md:text-left z-20"
          >
            <h3 className="text-2xl font-display font-bold mb-2">¿Necesitas un descanso?</h3>
            <p className="text-white/50 font-light mb-6 max-w-xs">
              Relájate un momento antes de seguir viendo el código. Intenta superar tu récord en el minijuego.
            </p>
            <motion.button
              onClick={() => setShowGame(true)}
              whileHover={reduce ? undefined : { scale: 1.02, boxShadow: '0 8px 32px rgba(16,185,129,0.22)' }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="group flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-colors duration-200 bg-white/5 border border-white/10 backdrop-blur-sm font-display rounded-full hover:bg-white/10 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg className="w-6 h-6 text-primary group-hover:animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Iniciar Arcade Mode
            </motion.button>
          </motion.div>
        </div>
      </div>

      {showGame && <ArcadeMinigame onClose={() => setShowGame(false)} />}
    </section>
  );
}
