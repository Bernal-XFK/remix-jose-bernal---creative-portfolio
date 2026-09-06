import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import ArcadeMinigame from './ArcadeMinigame';

const skills = [
  { name: 'React / Next.js', level: 90, color: '#61dafb' },
  { name: 'TypeScript', level: 85, color: '#3178c6' },
  { name: 'Tailwind CSS', level: 95, color: '#38bdf8' },
  { name: 'Framer Motion', level: 80, color: '#f27d26' },
  { name: 'Python / Big Data', level: 75, color: '#ffde57' },
  { name: 'UI/UX Design', level: 85, color: '#ff00ff' },
];

export default function Skills() {
  const ref = useRef(null);
  const [showGame, setShowGame] = useState(false);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="py-32 relative overflow-hidden bg-background" ref={ref}>
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-spin-slow-reverse" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-4 mb-4"
          >
            <div className="w-8 h-[1px] bg-primary" />
            <span className="font-mono text-primary text-sm uppercase tracking-widest">Habilidades</span>
            <div className="w-8 h-[1px] bg-primary" />
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-6xl font-display font-bold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Arsenal <span className="text-gradient">Tecnológico</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto mb-32">
          {skills.map((skill, index) => (
            <div key={skill.name} className="relative">
              <div className="flex justify-between mb-2 font-mono text-sm">
                <span className="text-white/80">{skill.name}</span>
                <span className="text-white/40">{skill.level}%</span>
              </div>
              
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{ backgroundColor: skill.color }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${skill.level}%` } : {}}
                  transition={{ duration: 1.5, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                />
                
                {/* Glow Effect */}
                <motion.div
                  className="absolute top-0 left-0 h-full blur-sm opacity-50"
                  style={{ backgroundColor: skill.color }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${skill.level}%` } : {}}
                  transition={{ duration: 1.5, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Planets & Arcade Section */}
        <div className="mt-20 relative h-[400px] flex flex-col md:flex-row items-center justify-center gap-20">
          
          {/* Orbital Visualization (Improved 3D Planets) */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Sun / Core */}
            <motion.div 
              className="w-48 h-48 rounded-full absolute mix-blend-screen"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffde57, #f27d26, transparent)',
                filter: 'blur(20px)'
              }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div 
              className="w-20 h-20 rounded-full z-10 flex items-center justify-center font-bold text-black font-display shadow-[0_0_50px_#f27d26]"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fff, #f27d26, #802000)'
              }}
            >
              CORE
            </div>
            
            {/* Orbits & Planets */}
            {[
              { size: 160, duration: 15, color: '#00ffcc', planetSize: 4, glow: 'shadow-[0_0_15px_#00ffcc]' },
              { size: 240, duration: 25, color: '#38bdf8', planetSize: 6, glow: 'shadow-[0_0_20px_#38bdf8]' },
              { size: 320, duration: 35, color: '#ff00ff', planetSize: 5, glow: 'shadow-[0_0_15px_#ff00ff]' }
            ].map((orbit, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/10"
                style={{
                  width: `${orbit.size}px`,
                  height: `${orbit.size}px`,
                  transformStyle: 'preserve-3d'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: orbit.duration, repeat: Infinity, ease: 'linear' }}
              >
                {/* 3D Planet */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 rounded-full ${orbit.glow}`}
                  style={{ 
                    top: `-${orbit.planetSize * 4}px`, // position exactly on the border
                    width: `${orbit.planetSize * 4}px`, 
                    height: `${orbit.planetSize * 4}px`,
                    background: `radial-gradient(circle at 30% 30%, #fff, ${orbit.color}, #000)` 
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Arcade Mini Game Trigger */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col items-center md:items-start text-center md:text-left z-20"
          >
            <h3 className="text-2xl font-display font-bold mb-2">¿Necesitas un descanso?</h3>
            <p className="text-white/50 font-light mb-6 max-w-xs">
              Relájate un momento antes de seguir viendo el código. Intenta superar tu récord en el minijuego.
            </p>
            <button
              onClick={() => setShowGame(true)}
              className="group flex items-center justify-center gap-3 px-8 py-4 font-bold text-white transition-all duration-200 bg-white/5 border border-white/10 backdrop-blur-sm font-display rounded-full hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <svg className="w-6 h-6 text-primary group-hover:animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Iniciar Arcade Mode
            </button>
          </motion.div>
        </div>
      </div>

      {showGame && <ArcadeMinigame onClose={() => setShowGame(false)} />}
    </section>
  );
}
