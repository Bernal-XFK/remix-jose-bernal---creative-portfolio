import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { SplitChars, Stagger, StaggerItem } from './motion-shared';

export default function About() {
  const ref = useRef(null);
  const reduce = useReducedMotion() === true;
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  // Parallax sutil del header/imagen (transform solo, sin layout shift)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const headY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const textVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const text = "Estudiante de Ingeniería de Sistemas (10° semestre, CESMAG) y estudiante de Big Data, apasionado por la creación de soluciones digitales innovadoras. Mi enfoque se centra en el desarrollo frontend y backend y el análisis de datos, buscando siempre el equilibrio perfecto entre funcionalidad, rendimiento y diseño excepcional.";

  return (
    <section id="sobre-mi" className="py-32 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div className="lg:col-span-5 relative" style={reduce ? undefined : { y: imgY }}>
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.95, rotate: -3 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.9, type: 'spring', stiffness: 60, damping: 20 }}
              className="relative aspect-square rounded-3xl overflow-hidden glass p-2"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 mix-blend-overlay z-10" />
              <img
                src="https://github.com/Bernal-XFK.png"
                alt="Jose Bernal"
                className="w-full h-full object-cover rounded-2xl filter grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />

              {/* Floating Badge */}
              <motion.div
                className="absolute -bottom-6 -right-6 glass rounded-2xl p-6 z-20 border border-white/10 shadow-2xl"
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="text-4xl font-display font-bold text-gradient mb-1">100%</div>
                <div className="text-xs font-mono text-white/50 uppercase tracking-wider">Dedicación</div>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div className="lg:col-span-7 lg:pl-12" style={reduce ? undefined : { y: headY }}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-mono text-primary text-sm uppercase tracking-widest">Sobre Mí</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
              <SplitChars text="Transformando ideas en" mode="scroll" />
              <br />
              <span className="text-white/50 italic font-light">
                <SplitChars text="experiencias digitales" mode="scroll" delay={0.15} />
              </span>
            </h2>

            <div className="text-lg md:text-xl text-white/70 leading-relaxed font-light mb-10">
              {text.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={textVariants}
                  initial={reduce ? false : 'hidden'}
                  animate={isInView ? 'visible' : 'hidden'}
                  className="inline-block mr-2"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            <Stagger className="grid grid-cols-2 gap-6" delay={0.2}>
              {[
                { label: 'Enfoque', value: 'Front · Back · Data' },
                { label: 'Ubicación', value: 'Pasto, Colombia' },
                { label: 'Educación', value: '10° sem · Big Data' },
                { label: 'Intereses', value: 'Análisis de datos' },
              ].map((item) => (
                <StaggerItem key={item.label}>
                  <motion.div
                    whileHover={reduce ? undefined : { scale: 1.02, borderColor: 'rgba(242,125,38,0.35)', boxShadow: '0 8px 32px rgba(242,125,38,0.12)' }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="glass p-4 rounded-xl border border-white/5"
                  >
                    <div className="text-xs font-mono text-white/40 mb-1 uppercase">{item.label}</div>
                    <div className="font-medium">{item.value}</div>
                  </motion.div>
                </StaggerItem>
              ))}
            </Stagger>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
