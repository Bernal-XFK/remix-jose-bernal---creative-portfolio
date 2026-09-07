import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import type { ReactNode, Key } from 'react';

/** Locked motion tokens — 60fps: transform + opacity only, no layout shift. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const REVEAL_Y = 24;
export const STAGGER = 0.08;
export const DUR = 0.7;

export function useMotionOK() {
  const reduce = useReducedMotion();
  return reduce !== true;
}

/* ------------------------------------------------------------------ */
/* Reveal on scroll: fade + up 24px, once, no layout shift             */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  className,
  delay = 0,
  y = REVEAL_Y,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  key?: Key;
}) {
  const ok = useMotionOK();
  if (!ok) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: DUR, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Stagger group / item — stagger 0.08                                 */
/* ------------------------------------------------------------------ */
export function Stagger({
  children,
  className,
  delay = 0,
  stagger = STAGGER,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  key?: Key;
}) {
  const ok = useMotionOK();
  if (!ok) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  key?: Key;
}) {
  const ok = useMotionOK();
  if (!ok) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: REVEAL_Y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Split text — chars with stagger. Decorative letters aria-hidden.    */
/* mode="load" → animate on mount (Hero). "scroll" → whileInView.       */
/* ------------------------------------------------------------------ */
export function SplitChars({
  text,
  className,
  delay = 0,
  stagger = 0.028,
  mode = 'scroll',
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: 'load' | 'scroll';
}) {
  const ok = useMotionOK();
  // A11y: readable label on parent, decorative split hidden from AT.
  if (!ok) return <span className={className}>{text}</span>;
  const words = text.split(' ');
  const animProps =
    mode === 'load'
      ? { initial: 'hidden' as const, animate: 'show' as const }
      : {
          initial: 'hidden' as const,
          whileInView: 'show' as const,
          viewport: { once: true, margin: '-80px' } as const,
        };
  let charIndex = 0;
  return (
    <motion.span
      className={className}
      aria-label={text}
      {...animProps}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span key={wi} className="inline-block whitespace-pre">
            {word.split('').map((ch) => {
              const i = charIndex++;
              void i;
              return (
                <motion.span
                  key={`${wi}-${charIndex}`}
                  className="inline-block will-change-transform"
                  variants={{
                    hidden: { opacity: 0, y: '0.4em' },
                    show: { opacity: 1, y: '0em', transition: { duration: 0.55, ease: EASE } },
                  }}
                >
                  {ch}
                </motion.span>
              );
            })}
            {wi < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
          </span>
        ))}
      </span>
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/* Scroll progress bar — top, fixed, spring. Hidden on reduced-motion.  */
/* ------------------------------------------------------------------ */
export function ScrollProgress() {
  const ok = useMotionOK();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  if (!ok) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[80] h-[3px] origin-left bg-gradient-to-r from-primary via-primary to-accent"
      style={{ scaleX }}
    />
  );
}

/* Shared micro-interaction tokens for hover glow (scale 1.02) */
export const hoverLift = {
  whileHover: { scale: 1.02, boxShadow: '0 8px 40px rgba(242,125,38,0.22)' },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 26 },
};
