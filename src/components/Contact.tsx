import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Socials from './Socials';
import { SplitChars, Reveal, Stagger, StaggerItem } from './motion-shared';

type Delivered = 'smtp' | 'log' | null;

interface ContactApiResponse {
  ok?: boolean;
  error?: string;
  details?: Record<string, string>;
  delivered?: Delivered;
  mailto?: string;
}

export default function Contact() {
  const ref = useRef(null);
  const reduce = useReducedMotion() === true;
  const formRef = useRef<HTMLFormElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<Delivered>(null);
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setDelivered(null);
    setMailtoUrl(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
      // Honeypot anti-spam (debe ir vacío; los bots lo rellenan).
      website: String(data.get('website') ?? ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let json: ContactApiResponse | null = null;
      try {
        json = await res.json() as ContactApiResponse;
      } catch {
        json = null;
      }

      if (!res.ok || !json?.ok) {
        const details = json?.details ? ` ${Object.values(json.details).join(' ')}` : '';
        const msg = (json?.error || `Error ${res.status}: no se pudo enviar.`) + details;
        setError(res.status === 429 ? (json?.error || msg) : msg);
        if (json?.mailto) setMailtoUrl(json.mailto);
        return;
      }

      setDelivered((json?.delivered as Delivered) ?? null);
      setMailtoUrl(json?.mailto ?? null);
      setIsSuccess(true);
      form.reset();
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setIsSuccess(false), 8000);
    } catch {
      setError('Error de red: no se pudo contactar el servidor. Revisa tu conexión o escríbeme directo.');
      // Fallback mailto local aunque no haya backend (asunto/cuerpo prellenado).
      const subject = `Portfolio: nuevo mensaje de ${payload.name || 'tu web'}`;
      const body = `Nombre: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`;
      setMailtoUrl(`mailto:jabernal.4395@unicesmag.edu.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-32 relative bg-background" ref={ref}>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+CjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[1px] bg-primary" />
              <span className="font-mono text-primary text-sm uppercase tracking-widest">Contacto</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-none">
              <SplitChars text="Hablemos de" mode="scroll" />
              <br />
              <span className="text-gradient">
                <SplitChars text="tu proyecto" mode="scroll" delay={0.12} />
              </span>
            </h2>

            <Reveal delay={0.1}>
            <p className="text-white/60 text-xl font-light mb-12 max-w-md leading-relaxed">
              ¿Tienes una idea en mente o buscas un desarrollador para tu equipo? Estoy disponible para nuevos retos.
            </p>
            </Reveal>

            <Stagger className="space-y-8" delay={0.15}>
              <StaggerItem>
              <motion.a
                href="mailto:jabernal.4395@unicesmag.edu.co"
                className="flex items-center gap-6 group hover-trigger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] rounded-2xl"
                whileHover={reduce ? undefined : { x: 8, scale: 1.01 }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  <svg aria-hidden="true" className="w-6 h-6 text-white/50 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-1">Email</div>
                  <div className="text-lg font-medium group-hover:text-primary transition-colors">jabernal.4395@unicesmag.edu.co</div>
                </div>
              </motion.a>
              </StaggerItem>

              <StaggerItem>
              <motion.a
                href="tel:+573234893219"
                className="flex items-center gap-6 group hover-trigger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] rounded-2xl"
                whileHover={reduce ? undefined : { x: 8, scale: 1.01 }}
              >
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  <svg aria-hidden="true" className="w-6 h-6 text-white/50 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <div className="font-mono text-xs text-white/40 uppercase tracking-widest mb-1">Teléfono</div>
                  <div className="text-lg font-medium group-hover:text-primary transition-colors">+57 323 489 3219</div>
                </div>
              </motion.a>
              </StaggerItem>

              <Socials label="Sígueme" className="pt-2" />
            </Stagger>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduce ? undefined : { scale: 1.005 }}
            className="glass rounded-3xl p-8 md:p-12 border border-white/10 relative"
          >
            {isSuccess ? (
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-3xl z-20 px-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                aria-live="polite"
              >
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">
                  {delivered === 'log' ? 'Revisa tu email para enviar' : '¡Mensaje enviado!'}
                </h3>
                {delivered === 'log' ? (
                  <>
                    <p className="text-white/60 text-center px-6 max-w-sm">
                      El servidor está en modo registro (sin SMTP configurado): tu mensaje
                      quedó guardado en el log pero <strong className="text-white">aún no se envió por correo</strong>.
                      Para completarlo, ábrelo en tu app de email y pulsa Enviar.
                    </p>
                    {mailtoUrl ? (
                      <a
                        href={mailtoUrl}
                        className="mt-6 inline-flex items-center justify-center px-8 py-3 font-bold text-white bg-primary font-display rounded-full hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Abrir en tu email para enviar
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className="text-white/50 text-center px-6">Gracias por contactarme. Te responderé lo más pronto posible.</p>
                )}
              </motion.div>
            ) : null}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" aria-live="polite" noValidate={false}>
              <div className="space-y-2">
                <label htmlFor="contact-name" className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Nombre</label>
                <input 
                  id="contact-name"
                  name="name"
                  type="text" 
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all disabled:opacity-60"
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="contact-email" className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Email</label>
                <input 
                  id="contact-email"
                  name="email"
                  type="email" 
                  required
                  maxLength={254}
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all disabled:opacity-60"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-message" className="font-mono text-xs text-white/40 uppercase tracking-widest ml-4">Mensaje</label>
                <textarea 
                  id="contact-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all resize-none disabled:opacity-60"
                  placeholder="Cuéntame sobre tu proyecto..."
                />
              </div>

              {/* Honeypot anti-spam: invisible para humanos, los bots lo rellenan. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {error ? (
                <p role="alert" aria-live="assertive" className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3">
                  {error}{' '}
                  {mailtoUrl ? (
                    <a href={mailtoUrl} className="underline text-red-100 hover:text-white">
                      Abrir en tu email
                    </a>
                  ) : null}
                </p>
              ) : null}

              {/* Estado para lectores de pantalla */}
              <p aria-live="polite" role="status" className="sr-only">
                {isSubmitting ? 'Enviando mensaje…' : isSuccess ? 'Mensaje enviado correctamente.' : ''}
              </p>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                whileHover={reduce || isSubmitting ? undefined : { scale: 1.02, boxShadow: '0 8px 40px rgba(242,125,38,0.35)' }}
                whileTap={reduce || isSubmitting ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-colors duration-200 bg-primary font-display rounded-full hover:bg-primary/90 active:scale-95 hover-trigger disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {isSubmitting ? (
                  reduce ? (
                    <span className="font-mono text-sm">Enviando…</span>
                  ) : (
                  <motion.div
                    aria-hidden="true"
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  )
                ) : (
                  <>
                    Enviar Mensaje
                    <svg aria-hidden="true" className="w-5 h-5 ml-2 -mr-1 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
