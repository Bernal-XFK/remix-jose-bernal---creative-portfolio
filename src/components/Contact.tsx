import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <section id="contacto" className="py-32 relative bg-background" ref={ref}>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+CjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-mono text-primary text-sm uppercase tracking-widest">Contacto</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-none">
              Hablemos de <br />
              <span className="text-gradient">tu proyecto</span>
            </h2>
            
            <p className="text-white/60 text-xl font-light mb-12 max-w-md leading-relaxed">
              ¿Tienes una idea en mente o buscas un desarrollador para tu equipo? Estoy disponible para nuevos retos.
            </p>

            <div className="space-y-8">
              <motion.a 
                href="mailto:jabernal.4395@unicesmag.edu.co"
                className="flex items-center gap-6 group hover-trigger"
                whileHover={{ x: 10 }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  <svg className="w-6 h-6 text-white/50 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-1">Email</div>
                  <div className="text-lg font-medium group-hover:text-primary transition-colors">jabernal.4395@unicesmag.edu.co</div>
                </div>
              </motion.a>

              <motion.a 
                href="tel:+573234893219"
                className="flex items-center gap-6 group hover-trigger"
                whileHover={{ x: 10 }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  <svg className="w-6 h-6 text-white/50 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-1">Teléfono</div>
                  <div className="text-lg font-medium group-hover:text-primary transition-colors">+57 323 489 3219</div>
                </div>
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass rounded-3xl p-8 md:p-12 border border-white/10 relative"
          >
            {isSuccess ? (
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">¡Mensaje Enviado!</h3>
                <p className="text-white/50 text-center px-6">Gracias por contactarme. Te responderé lo más pronto posible.</p>
              </motion.div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Nombre</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Mensaje</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all resize-none"
                  placeholder="Cuéntame sobre tu proyecto..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-primary font-display rounded-full hover:bg-primary/90 hover:scale-[1.02] active:scale-95 hover-trigger disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <motion.div 
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    Enviar Mensaje
                    <svg className="w-5 h-5 ml-2 -mr-1 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
