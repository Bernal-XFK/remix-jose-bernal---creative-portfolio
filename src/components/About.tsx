import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }),
  };

  const text = "Estudiante de Ingeniería de Sistemas apasionado por la creación de soluciones digitales innovadoras. Mi enfoque se centra en el desarrollo web moderno y el análisis de datos (Big Data), buscando siempre el equilibrio perfecto entre funcionalidad, rendimiento y diseño excepcional.";

  return (
    <section id="sobre-mi" className="py-32 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 1, type: 'spring' }}
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
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="text-4xl font-display font-bold text-gradient mb-1">100%</div>
                <div className="text-xs font-mono text-white/50 uppercase tracking-wider">Dedicación</div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 lg:pl-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-mono text-primary text-sm uppercase tracking-widest">Sobre Mí</span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
              Transformando ideas en <br />
              <span className="text-white/50 italic font-light">experiencias digitales</span>
            </h2>

            <div className="text-lg md:text-xl text-white/70 leading-relaxed font-light mb-10">
              {text.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={textVariants}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  className="inline-block mr-2"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Enfoque', value: 'Frontend & Data' },
                { label: 'Ubicación', value: 'Colombia' },
                { label: 'Educación', value: 'Ing. de Sistemas' },
                { label: 'Intereses', value: 'Creative Coding' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="glass p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-colors"
                >
                  <div className="text-xs font-mono text-white/40 mb-1 uppercase">{item.label}</div>
                  <div className="font-medium">{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
