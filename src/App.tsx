import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CustomCursor from './components/CustomCursor';
import Loader from './components/Loader';
import { ScrollProgress } from './components/motion-shared';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import CV from './components/CV';
import PokemonSlots from './components/PokemonSlots';
import Contact from './components/Contact';
import Socials from './components/Socials';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-black">
      <CustomCursor />
      <ScrollProgress />
      
      <AnimatePresence>
        {loading && <Loader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Navigation (Simple floating nav) */}
          <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full border border-white/10 hidden md:flex gap-8 text-sm font-mono uppercase tracking-widest">
            <a href="#sobre-mi" className="hover:text-primary transition-colors hover-trigger">Sobre Mí</a>
            <a href="#proyectos" className="hover:text-primary transition-colors hover-trigger">Proyectos</a>
            <a href="#skills" className="hover:text-primary transition-colors hover-trigger">Skills</a>
            <a href="#cv" className="hover:text-primary transition-colors hover-trigger">CV</a>
            <a href="#contacto" className="hover:text-primary transition-colors hover-trigger">Contacto</a>
          </nav>

          <Hero />
          <About />
          <Projects />
          <Skills />
          <CV />
          <PokemonSlots />
          <Contact />
          
          <footer className="py-8 border-t border-white/5 font-mono text-xs text-white/30 uppercase tracking-widest">
            <div className="flex flex-col items-center gap-5 px-6 text-center">
              <Socials className="justify-center" />
              <p>© {new Date().getFullYear()} Jose Alejandro Bernal Figueroa. All rights reserved.</p>
              <p className="mt-0">Designed with <span className="text-primary">♥</span> and Code</p>
            </div>
          </footer>
        </motion.main>
      )}
    </div>
  );
}
