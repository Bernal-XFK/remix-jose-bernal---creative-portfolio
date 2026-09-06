import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const DINO_SPRITE = [
  "             ████████ ",
  "            ███ █████ ",
  "            █████████ ",
  "            ██████    ",
  "            █████████ ",
  "            ██████    ",
  "            █████     ",
  "      ██    ████      ",
  "     ███   ████       ",
  "    ███████████       ",
  "   ████████████       ",
  "   ████████████       ",
  "  ████████████        ",
  "  ███████████         ",
  "   ████████           ",
  "    ██████            ",
  "     ██  █            ",
  "     █   █            ",
  "    ██   ██           "
];

const CACTUS_SPRITE = [
  "   ██     ",
  "   ██     ",
  " ████     ",
  " ████  ██ ",
  " ████  ██ ",
  " ████████ ",
  "   ██████ ",
  "   ████   ",
  "   ████   ",
  "   ████   ",
  "   ████   ",
  "   ████   "
];

const PIXEL_SIZE = 2;

export default function ArcadeMinigame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Game variables
    const dinoWidth = 22 * PIXEL_SIZE;
    const dinoHeight = 19 * PIXEL_SIZE;
    const groundY = 170;
    
    let dino = { x: 50, y: groundY - dinoHeight, width: dinoWidth, height: dinoHeight, dy: 0, gravity: 0.6, jumpPower: -10, isJumping: false };
    let obstacles: { x: number, y: number, width: number, height: number, speed: number }[] = [];
    let frame = 0;
    let currentScore = 0;
    
    const drawSprite = (spriteMap: string[], x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      for (let row = 0; row < spriteMap.length; row++) {
        for (let col = 0; col < spriteMap[row].length; col++) {
          if (spriteMap[row][col] === '█') {
            ctx.fillRect(x + col * PIXEL_SIZE, y + row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }
    };

    const drawDino = () => {
      drawSprite(DINO_SPRITE, dino.x, dino.y, '#10B981'); // Primary color
    };

    const drawObstacles = () => {
      obstacles.forEach(obs => {
        drawSprite(CACTUS_SPRITE, obs.x, obs.y, '#EF4444');
      });
    };

    const update = () => {
      if (gameOver) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#333';
      ctx.fillRect(0, groundY, canvas.width, 2);

      // Dino physics
      dino.dy += dino.gravity;
      dino.y += dino.dy;

      // Ground collision
      if (dino.y + dino.height > groundY) {
        dino.y = groundY - dino.height;
        dino.dy = 0;
        dino.isJumping = false;
      }

      // Generate obstacles
      if (frame % 90 === 0) {
        const cactusWidth = 10 * PIXEL_SIZE;
        const cactusHeight = 12 * PIXEL_SIZE;
        obstacles.push({
          x: canvas.width,
          y: groundY - cactusHeight,
          width: cactusWidth,
          height: cactusHeight,
          speed: 5 + (currentScore * 0.1) // Increases speed over time
        });
      }

      // Update and draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;

        // Collision detection (with a smaller hitbox for better gameplay)
        const hitboxMargin = 4;
        if (
          dino.x + hitboxMargin < obstacles[i].x + obstacles[i].width - hitboxMargin &&
          dino.x + dino.width - hitboxMargin > obstacles[i].x + hitboxMargin &&
          dino.y + hitboxMargin < obstacles[i].y + obstacles[i].height - hitboxMargin &&
          dino.y + dino.height - hitboxMargin > obstacles[i].y + hitboxMargin
        ) {
          setGameOver(true);
          return; // Stop updating
        }

        // Remove off-screen obstacles and increase score
        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
          currentScore += 10;
          setScore(currentScore);
        }
      }

      drawDino();
      drawObstacles();
      
      frame++;
      animationFrameId = requestAnimationFrame(update);
    };

    const jump = () => {
      if (!dino.isJumping && !gameOver) {
        dino.dy = dino.jumpPower;
        dino.isJumping = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameOver) {
          // Restart
          dino.y = groundY - dinoHeight;
          dino.dy = 0;
          obstacles = [];
          currentScore = 0;
          setScore(0);
          setGameOver(false);
          frame = 0;
          update();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    update(); // Start loop

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <div className="relative bg-gray-900 border border-white/10 p-8 rounded-3xl max-w-lg w-full flex flex-col items-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-[60] text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-widest text-primary">Arcade Mini</h2>
          <p className="font-mono text-white/50 mb-6">Score: {score}</p>
          
          <div className="bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl shadow-primary/20 cursor-pointer" onClick={() => {
            if (!gameStarted) setGameStarted(true);
            else if (gameOver) { setGameOver(false); setScore(0); }
            else {
              // Trigger jump click for mobile
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
            }
          }}>
            {!gameStarted ? (
              <div className="w-[400px] h-[200px] flex items-center justify-center text-white/50 font-mono text-sm hover:text-primary transition-colors">
                Haz clic o presiona Espacio para iniciar
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={200} 
                className="block"
              />
            )}
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-3xl backdrop-blur-sm">
              <h3 className="text-4xl font-display font-bold text-red-500 mb-2">Game Over</h3>
              <p className="font-mono text-white mb-6">Puntaje Final: {score}</p>
              <button 
                onClick={() => { setGameOver(false); setScore(0); }}
                className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
              >
                Jugar de nuevo
              </button>
            </div>
          )}
          
          <p className="font-mono text-[10px] text-white/30 mt-6 text-center max-w-xs">
            Presiona Espacio o haz clic en el juego para saltar los obstáculos.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
