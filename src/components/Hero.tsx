import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { SplitChars } from './motion-shared';

const ROLES = ['Ingeniero en formación', 'Big Data', 'Developer'];

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Sin layout shift: el parallax solo usa transform/opacity.
  const parallaxStyle = reduce ? undefined : { y: y1, opacity, scale };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Animated Background Elements */}
      <motion.div
        aria-hidden="true"
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen"
        animate={reduce ? undefined : { x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/20 rounded-full blur-[150px] mix-blend-screen"
        animate={reduce ? undefined : { x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.5, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div style={parallaxStyle} className="text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 glass text-sm font-mono text-white/70"
          >
            Hola, mundo. Soy
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter leading-[1.05] text-balance max-w-4xl mx-auto mb-5">
            <SplitChars text="Jose Alejandro" mode="load" delay={0.35} className="block" />
            <SplitChars
              text="Bernal Figueroa"
              mode="load"
              delay={0.55}
              className="block text-gradient"
            />
          </h1>

          <motion.p
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] sm:text-xs md:text-sm font-mono font-normal tracking-[0.22em] uppercase text-white/60"
            initial={reduce ? false : 'hidden'}
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } },
            }}
          >
            {ROLES.map((role, i) => (
              <motion.span
                key={role}
                className="flex items-center gap-4"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                {i > 0 && (
                  <span aria-hidden="true" className="text-primary/80 text-[0.8em]">
                    •
                  </span>
                )}
                {role}
              </motion.span>
            ))}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <motion.a
              href="#proyectos"
              whileHover={reduce ? undefined : { scale: 1.02, boxShadow: '0 8px 40px rgba(242,125,38,0.35)' }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 bg-primary font-display rounded-full hover:bg-primary/90 active:scale-95 hover-trigger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver Proyectos
              <svg
                aria-hidden="true"
                className="w-4 h-4 ml-2 -mr-1 transition-transform duration-200 group-hover:translate-x-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={reduce ? undefined : { y: y2 }}
      >
        <span className="text-xs font-mono text-white/30 mb-2 uppercase tracking-widest">Scroll</span>
        <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
          {reduce ? (
            <div className="absolute top-0 left-0 w-full h-1/2 bg-primary" />
          ) : (
            <motion.div
              className="absolute top-0 left-0 w-full h-1/2 bg-primary"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      </motion.div>
    </section>
  );
}
