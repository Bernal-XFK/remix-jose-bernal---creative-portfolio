import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: progress >= 100 ? 0 : 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.5 }}
      onAnimationComplete={() => {
        if (progress >= 100) {
          // Hide completely after fade out
        }
      }}
      style={{ pointerEvents: progress >= 100 ? 'none' : 'auto' }}
    >
      <div className="relative w-64 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: 'circOut', duration: 0.2 }}
        />
      </div>
      <div className="mt-4 font-mono text-sm text-white/50 tracking-widest">
        {progress}%
      </div>
      <motion.div 
        className="absolute bottom-10 font-display text-4xl font-bold text-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        JABF
      </motion.div>
    </motion.div>
  );
}
