import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import React, { useRef, useState, useEffect } from 'react';
import { SplitChars, Reveal } from './motion-shared';

export default function Projects() {
  const containerRef = useRef(null);
  const reduce = useReducedMotion() === true;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const scaleHeader = useTransform(scrollYProgress, [0, 1], [0.96, 1.02]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setProjects(data);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        setError(error.message || "Error desconocido al cargar proyectos.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section id="proyectos" className="py-32 relative bg-black" ref={containerRef}>
      <div className="container mx-auto px-6">
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={reduce ? undefined : { y, scale: scaleHeader }}
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-mono text-primary text-sm uppercase tracking-widest">Portafolio</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold leading-none">
              <SplitChars text="Proyectos" mode="scroll" />
              <br />
              <SplitChars text="Destacados" mode="scroll" delay={0.12} />
            </h2>
          </div>
          <p className="text-white/50 max-w-md font-light text-lg">
            Una selección de mis trabajos recientes, combinando desarrollo frontend creativo y análisis de datos.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-white/30 font-mono text-xs uppercase tracking-widest">Conectando con GitHub...</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-20 text-center glass border border-red-500/20 rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="text-red-400 mb-4 flex justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Error al cargar proyectos</h3>
            <p className="text-white/60 mb-6 font-light">{error}</p>
            <div className="bg-black/50 p-4 rounded text-left mb-6 font-mono text-[10px] text-white/40 overflow-x-auto">
              Sugerencia: Verifica que la variable de entorno GITHUB_TOKEN esté configurada en Vercel si estás siendo bloqueado por Rate Limit.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-32">
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <Reveal key={project.id} delay={Math.min(index * 0.05, 0.2)}>
                  <ProjectCard project={project} index={index} />
                </Reveal>
              ))
            ) : (
              <p className="text-white/50 text-center">No hay proyectos disponibles en la base de datos.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: any, index: number, key?: React.Key }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() === true;
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'center center']
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.4, 1]);
  const isEven = index % 2 === 0;

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!cardRef.current || reduce) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      style={reduce ? undefined : { scale, opacity }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center group`}
    >
      <motion.div
        className="w-full lg:w-3/5 relative aspect-[4/3] rounded-3xl overflow-hidden cursor-none"
        style={reduce ? undefined : {
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={reduce ? undefined : { scale: 1.02, boxShadow: '0 12px 60px rgba(242,125,38,0.18)' }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"
          animate={{ opacity: isHovered && !reduce ? 0.3 : 0.8 }}
          transition={{ duration: 0.5 }}
        />

        <motion.img
          src={!imgError ? project.image : project.fallbackImage}
          alt={project.title}
          className="w-full h-full object-cover filter grayscale"
          animate={{
            scale: isHovered && !reduce ? 1.06 : 1,
            filter: isHovered ? 'grayscale(0%)' : 'grayscale(100%)'
          }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          referrerPolicy="no-referrer"
          style={reduce ? undefined : {
            transform: "translateZ(50px)",
          }}
          onError={() => {
            if (!imgError) setImgError(true);
          }}
        />

        {/* Hover Reveal Content - Now Clickable */}
        <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`Ver repositorio de ${project.title}`}>
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={reduce ? undefined : {
              transform: "translateZ(100px)",
            }}
          >
            <div className="w-24 h-24 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center text-white font-bold tracking-widest uppercase text-sm transform -rotate-12 hover:scale-110 transition-transform">
              Ver Repo
            </div>
          </motion.div>
        </a>
      </motion.div>

      <div className="w-full lg:w-2/5 flex flex-col justify-center">
        <div className="font-mono text-primary text-sm mb-4">0{index + 1}</div>
        <h3 className="text-3xl md:text-4xl font-display font-bold mb-6 group-hover:text-primary transition-colors duration-300 flex items-center gap-4">
          {project.title}
          {project.stars > 0 && (
            <span className="text-sm font-mono bg-white/10 px-3 py-1 rounded-full flex items-center gap-1 text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {project.stars}
            </span>
          )}
        </h3>
        <p className="text-white/60 text-lg font-light mb-8 leading-relaxed">
          {project.description}
        </p>

        <motion.div
          className="flex flex-wrap gap-3 mb-10"
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {project.tech.map((t: string) => (
            <motion.span
              key={t}
              variants={reduce ? undefined : {
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white/70 bg-white/5 backdrop-blur-sm"
            >
              {t}
            </motion.span>
          ))}
        </motion.div>

        <div className="flex items-center gap-6">
          {project.github && project.github !== '#' && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors hover-trigger flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              GitHub
            </a>
          )}
          {project.demo && project.demo !== '#' && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-white transition-colors hover-trigger flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Live Demo
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
