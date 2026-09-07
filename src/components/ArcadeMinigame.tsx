import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ------------------------------------------------------------------ */
/* Constantes fieles al dino real de Chrome                            */
/* ------------------------------------------------------------------ */
const W = 600;
const H = 150;
const GROUND_Y = 127;
const DINO_X = 24;
const FG = "#535353";
const BG = "#ffffff";
const NIGHT_BG = "#000000";
const NIGHT_FG = "#ffffff";
const GRAVITY = 0.6;
const JUMP_V0 = -10.5;
const INIT_SPEED = 6;
const MAX_SPEED = 13;
const HI_KEY = "chrome-dino-hi";
const PIXEL = 2;

const STAND_W = 38;
const STAND_H = 44;
const DUCK_W = 62;
const DUCK_H = 24;

/* Dino: 2 frames corriendo (solo cambian las piernas), 1 frame muerto */
const DINO_TOP: string[] = [
  "        \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  ",
  "       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ",
  "       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
  "       \u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
  "       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
  "       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ",
  "       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588   ",
  "        \u2588\u2588\u2588\u2588\u2588\u2588    ",
  "  \u2588      \u2588\u2588\u2588\u2588     ",
  "  \u2588\u2588    \u2588\u2588\u2588\u2588\u2588     ",
  "  \u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588    ",
  "  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588    ",
  "  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588   ",
  "  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588   ",
  "   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588    ",
  "    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588     ",
  "    \u2588\u2588\u2588\u2588\u2588\u2588       ",
];
const LEGS_A: string[] = [
  "    \u2588\u2588   \u2588\u2588       ",
  "    \u2588\u2588   \u2588\u2588\u2588      ",
  "    \u2588     \u2588\u2588\u2588\u2588    ",
  "   \u2588\u2588       \u2588\u2588    ",
];
const LEGS_B: string[] = [
  "    \u2588\u2588    \u2588\u2588      ",
  "    \u2588\u2588\u2588    \u2588\u2588     ",
  "     \u2588\u2588\u2588\u2588   \u2588     ",
  "      \u2588\u2588    \u2588\u2588      ",
];
const LEGS_DEAD: string[] = [
  "    \u2588\u2588   \u2588\u2588       ",
  "    \u2588\u2588   \u2588\u2588       ",
  "    \u2588\u2588   \u2588\u2588       ",
  "   \u2588\u2588     \u2588\u2588      ",
];
const DINO_RUN_1 = [...DINO_TOP, ...LEGS_A];
const DINO_RUN_2 = [...DINO_TOP, ...LEGS_B];
const DINO_DEAD = [...DINO_TOP, ...LEGS_DEAD];

/* Dino agachado: 2 frames (cuerpo largo y bajo) */
const DUCK_TOP: string[] = [
  "                   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588   ",
  "                  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ",
  "                  \u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
  "         \u2588        \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
  "         \u2588\u2588       \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  ",
  "         \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588    ",
  "         \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588   ",
  "          \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588    ",
];
const DUCK_LEGS_A: string[] = [
  "            \u2588\u2588\u2588\u2588    \u2588\u2588\u2588\u2588        ",
  "            \u2588\u2588\u2588      \u2588\u2588\u2588        ",
  "           \u2588\u2588        \u2588\u2588\u2588\u2588       ",
];
const DUCK_LEGS_B: string[] = [
  "            \u2588\u2588\u2588\u2588     \u2588\u2588\u2588        ",
  "             \u2588\u2588\u2588      \u2588\u2588\u2588\u2588      ",
  "             \u2588\u2588        \u2588\u2588\u2588       ",
];
const DINO_DUCK_1 = [...DUCK_TOP, ...DUCK_LEGS_A];
const DINO_DUCK_2 = [...DUCK_TOP, ...DUCK_LEGS_B];

/* 6 cactus: 3 peque\u00f1os + 3 grandes */
const CACTUS_VARIANTS: { w: number; h: number }[] = [
  { w: 15, h: 33 },
  { w: 17, h: 35 },
  { w: 15, h: 34 },
  { w: 22, h: 48 },
  { w: 25, h: 50 },
  { w: 23, h: 47 },
];
const PTERO_W = 44;
const PTERO_H = 26;
const PTERO_Y = [50, 74, 100];

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "cactus" | "ptero";
  variant: number;
}
interface Cloud {
  x: number;
  y: number;
}
interface Bump {
  x: number;
  y: number;
  w: number;
}
interface Star {
  x: number;
  y: number;
  r: number;
}

function loadHi(): number {
  try {
    const raw = localStorage.getItem(HI_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export default function ArcadeMinigame({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetFnRef = useRef<(() => void) | null>(null);
  const jumpFnRef = useRef<(() => void) | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scoreUi, setScoreUi] = useState(0);
  const [hiUi, setHiUi] = useState<number>(() => loadHi());
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ---------------- estado mutable del juego ---------------- */
    let dinoY = GROUND_Y - STAND_H;
    let dinoVY = 0;
    let onGround = true;
    let ducking = false;
    let dead = false;
    let started = false;
    let over = false;
    let speed = INIT_SPEED;
    let scoreFloat = 0;
    let lastShownScore = -1;
    let lastHundred = 0;
    let hi = loadHi();
    let frame = 0;
    let flashTimer = 0;
    let obstacles: Obstacle[] = [];
    let clouds: Cloud[] = [
      { x: 120, y: 32 },
      { x: 340, y: 52 },
      { x: 520, y: 24 },
    ];
    let bumps: Bump[] = Array.from({ length: 34 }, () => ({
      x: Math.random() * (W + 200) - 100,
      y: GROUND_Y + 6 + Math.random() * 14,
      w: 2 + Math.random() * 8,
    }));
    let stars: Star[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: 6 + Math.random() * 80,
      r: Math.random() < 0.3 ? 1.6 : 1,
    }));
    let moonX = W - 110;
    let distSinceSpawn = 0;
    let nextGap = 380;
    let runAlt = false;
    let flapUp = false;
    let raf = 0;
    let audioCtx: AudioContext | null = null;
    let restartBounds = { x: W / 2 - 18, y: 88, w: 36, h: 36 };

    const ensureAudio = (): AudioContext | null => {
      try {
        if (!audioCtx) {
          const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext;
          if (!AC) return null;
          audioCtx = new AC();
        }
        if (audioCtx.state === "suspended") void audioCtx.resume();
        return audioCtx;
      } catch {
        return null;
      }
    };

    const tone = (
      f0: number,
      f1: number,
      dur: number,
      type: OscillatorType,
      vol = 0.06,
    ): void => {
      if (mutedRef.current) return;
      const ac = ensureAudio();
      if (!ac) return;
      try {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f0, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(1, f1),
          ac.currentTime + dur,
        );
        gain.gain.setValueAtTime(vol, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + dur + 0.02);
      } catch {
        /* audio opcional: nunca romper el juego */
      }
    };

    const sfxJump = (): void => tone(320, 760, 0.14, "square", 0.045);
    const sfxScore = (): void => {
      tone(880, 880, 0.07, "sine", 0.05);
      window.setTimeout(() => tone(1318, 1318, 0.09, "sine", 0.05), 70);
    };
    const sfxDie = (): void => tone(420, 90, 0.32, "sawtooth", 0.06);

    const isNight = (): boolean =>
      Math.floor(Math.floor(scoreFloat) / 700) % 2 === 1;

    /* ---------- resetGame() compartida: \u00fanico punto de reinicio ---------- */
    const resetGame = (): void => {
      obstacles = [];
      frame = 0;
      scoreFloat = 0;
      lastShownScore = -1;
      lastHundred = 0;
      flashTimer = 0;
      speed = INIT_SPEED;
      dinoY = GROUND_Y - STAND_H;
      dinoVY = 0;
      onGround = true;
      ducking = false;
      dead = false;
      over = false;
      started = true;
      distSinceSpawn = 0;
      nextGap = 320 + Math.random() * 280;
      setGameOver(false);
      setGameStarted(true);
      setScoreUi(0);
    };
    resetFnRef.current = resetGame;

    const doJump = (): void => {
      if (!started) {
        resetGame();
        sfxJump();
        return;
      }
      if (over) return;
      if (onGround && !dead) {
        // saltar cancela visualmente el agachado pero mantiene fast-fall si se sujeta Down
        dinoVY = JUMP_V0;
        onGround = false;
        if (ducking) {
          dinoY = Math.min(dinoY, GROUND_Y - STAND_H);
        }
        sfxJump();
      }
    };
    jumpFnRef.current = doJump;

    const startIfIdle = (): void => {
      if (!started) {
        resetGame();
      } else if (over) {
        resetGame();
      } else {
        doJump();
      }
    };

    /* ---------------- spawner por distancia ---------------- */
    const spawnObstacle = (): void => {
      const s = Math.floor(scoreFloat);
      const wantPtero = s > 450 && Math.random() < 0.32;
      if (wantPtero) {
        const y = PTERO_Y[Math.floor(Math.random() * PTERO_Y.length)];
        obstacles.push({
          x: W + 12,
          y,
          w: PTERO_W,
          h: PTERO_H,
          kind: "ptero",
          variant: 0,
        });
        return;
      }
      // grupo de cactus 1-3, variante aleatoria entre las 6
      const group = 1 + Math.floor(Math.random() * 3);
      const variant = Math.floor(Math.random() * CACTUS_VARIANTS.length);
      const def = CACTUS_VARIANTS[variant];
      let cx = W + 12;
      for (let i = 0; i < group; i++) {
        obstacles.push({
          x: cx,
          y: GROUND_Y - def.h,
          w: def.w,
          h: def.h,
          kind: "cactus",
          variant,
        });
        cx += def.w + 5;
      }
    };

    /* ---------------- dibujo ---------------- */
    const drawMap = (
      map: string[],
      x: number,
      y: number,
      color: string,
    ): void => {
      ctx.fillStyle = color;
      for (let r = 0; r < map.length; r++) {
        const row = map[r];
        for (let c = 0; c < row.length; c++) {
          if (row[c] === "\u2588") {
            ctx.fillRect(
              Math.round(x + c * PIXEL),
              Math.round(y + r * PIXEL),
              PIXEL,
              PIXEL,
            );
          }
        }
      }
    };

    const drawGround = (fg: string): void => {
      ctx.fillStyle = fg;
      ctx.fillRect(0, GROUND_Y, W, 2);
      for (const b of bumps) {
        ctx.fillRect(Math.round(b.x), Math.round(b.y), Math.round(b.w), 2);
      }
    };

    const drawCloud = (c: Cloud, fg: string): void => {
      ctx.fillStyle = fg;
      const x = Math.round(c.x);
      const y = Math.round(c.y);
      // nube pixelada estilo Chrome (3 bloques)
      ctx.fillRect(x, y + 8, 46, 10);
      ctx.fillRect(x + 9, y, 28, 20);
      ctx.fillRect(x + 33, y + 4, 15, 15);
    };

    const drawCactus = (
      o: Obstacle,
      fg: string,
    ): void => {
      const { x, variant } = o;
      const yBase = GROUND_Y;
      const h = o.h;
      const w = o.w;
      ctx.fillStyle = fg;
      const cx = Math.round(x + w / 2 - 3);
      const top = Math.round(yBase - h);
      // columna central
      ctx.fillRect(cx, top, 7, h);
      ctx.fillRect(cx + 1, top - 1, 5, 2);
      // brazos (var\u00edan por variante)
      const tall = h > 40;
      const armH = tall ? 14 : 10;
      const leftY = top + 8 + (variant % 3) * 4;
      const rightY = top + 12 + ((variant + 1) % 3) * 4;
      // brazo izquierdo
      ctx.fillRect(cx - 8, leftY, 4, armH);
      ctx.fillRect(cx - 8, leftY + armH - 3, 8, 3);
      ctx.fillRect(cx - 8, leftY, 4, 2);
      // brazo derecho
      ctx.fillRect(cx + 11, rightY, 4, armH);
      ctx.fillRect(cx + 7, rightY + armH - 3, 8, 3);
      ctx.fillRect(cx + 11, rightY, 4, 2);
    };

    const drawPtero = (o: Obstacle, fg: string): void => {
      const x = Math.round(o.x);
      const y = Math.round(o.y);
      ctx.fillStyle = fg;
      // cuerpo + cabeza + pico + cola
      ctx.fillRect(x + 6, y + 12, 26, 9);
      ctx.fillRect(x + 30, y + 8, 10, 10);
      ctx.fillRect(x + 40, y + 11, 6, 4);
      ctx.fillRect(x, y + 14, 7, 4);
      // ala (2 frames)
      if (flapUp) {
        ctx.fillRect(x + 13, y - 6, 17, 12);
        ctx.fillRect(x + 13, y - 10, 9, 5);
      } else {
        ctx.fillRect(x + 13, y + 20, 17, 9);
        ctx.fillRect(x + 19, y + 29, 6, 4);
      }
    };

    const drawDino = (fg: string): void => {
      if (dead) {
        drawMap(DINO_DEAD, DINO_X, dinoY, fg);
        return;
      }
      const duckOnGround = ducking && onGround;
      if (duckOnGround) {
        drawMap(runAlt ? DINO_DUCK_1 : DINO_DUCK_2, DINO_X, dinoY, fg);
      } else if (!onGround) {
        // en el aire: frame est\u00e1tico (piernas juntas)
        drawMap(DINO_RUN_1, DINO_X, dinoY, fg);
      } else {
        drawMap(runAlt ? DINO_RUN_1 : DINO_RUN_2, DINO_X, dinoY, fg);
      }
    };

    const drawMoonStars = (fg: string): void => {
      for (const s of stars) {
        ctx.fillStyle = fg;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r > 1.2 ? 2 : 1, s.r > 1.2 ? 2 : 1);
      }
      // luna con cr\u00e1teres
      const mx = Math.round(moonX);
      const my = 30;
      ctx.beginPath();
      ctx.arc(mx, my, 12, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.fillStyle = isNight() ? NIGHT_BG : BG;
      ctx.beginPath();
      ctx.arc(mx - 3, my - 2, 3, 0, Math.PI * 2);
      ctx.arc(mx + 3, my + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHUD = (fg: string): void => {
      const s = Math.floor(scoreFloat);
      const txt = String(s).padStart(5, "0");
      const hiTxt = String(Math.max(hi, s)).padStart(5, "0");
      ctx.fillStyle = fg;
      ctx.font = '12px "Courier New", ui-monospace, monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      // flash cada 100 pts: parpadea el marcador
      const show = !(flashTimer > 0 && Math.floor(flashTimer / 2) % 2 === 0);
      if (show) {
        ctx.fillText(`HI ${hiTxt}  ${txt}`, W - 10, 8);
      } else {
        ctx.fillText(`HI ${hiTxt}`, W - 10, 8);
      }
      ctx.textAlign = "left";
    };

    const drawGameOverPanel = (fg: string): void => {
      // panel GAME OVER estilo Chrome
      ctx.fillStyle = fg;
      ctx.font = 'bold 15px "Courier New", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("G A M E  O V E R", W / 2, 58);
      // icono restart circular
      const { x, y, w, h } = restartBounds;
      const cxr = x + w / 2;
      const cyr = y + h / 2;
      const r = 13;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cxr, cyr, r, 0.4, Math.PI * 2 - 0.15);
      ctx.stroke();
      // punta de flecha
      const ax = cxr + r * Math.cos(0.4);
      const ay = cyr + r * Math.sin(0.4);
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(ax + 1, ay - 7);
      ctx.lineTo(ax + 7, ay + 2);
      ctx.lineTo(ax - 4, ay + 4);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = "left";
    };

    const drawIdleHint = (fg: string): void => {
      ctx.fillStyle = fg;
      ctx.font = '12px "Courier New", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.fillText("Pulsa ESPACIO o toca para empezar", W / 2, 96);
      ctx.textAlign = "left";
    };

    /* ---------------- update ---------------- */
    const update = (): void => {
      frame++;
      const night = isNight();
      const fg = night ? NIGHT_FG : FG;

      if (flashTimer > 0) flashTimer--;
      // 10 fps para correr (alterna cada 6 frames a 60fps)
      if (frame % 6 === 0) runAlt = !runAlt;
      if (frame % 14 === 0) flapUp = !flapUp;

      if (started && !over) {
        // velocidad 6 -> 13 clamp, +0.001/frame
        if (speed < MAX_SPEED) speed = Math.min(MAX_SPEED, speed + 0.001);

        // f\u00edsica dino
        const curH = ducking && onGround ? DUCK_H : STAND_H;
        dinoVY += GRAVITY;
        if (ducking && !onGround) dinoVY += 0.9; // fast-fall con Down
        if (dinoVY > 13) dinoVY = 13;
        dinoY += dinoVY;
        const floor = GROUND_Y - curH;
        if (dinoY >= floor) {
          dinoY = floor;
          dinoVY = 0;
          onGround = true;
        } else {
          onGround = false;
        }
        // si est\u00e1 en suelo y cambia de postura, reasienta
        if (onGround) {
          const wantH = ducking ? DUCK_H : STAND_H;
          dinoY = GROUND_Y - wantH;
        }

        // score por distancia
        scoreFloat += speed * 0.025;
        const sInt = Math.floor(scoreFloat);
        if (sInt !== lastShownScore) {
          lastShownScore = sInt;
          setScoreUi(sInt);
        }
        // flash + sonido cada 100 pts
        if (Math.floor(sInt / 100) > lastHundred) {
          lastHundred = Math.floor(sInt / 100);
          flashTimer = 10;
          sfxScore();
        }

        // scroll suelo / nubes / estrellas / luna
        for (const b of bumps) {
          b.x -= speed;
          if (b.x < -20) {
            b.x = W + Math.random() * 80;
            b.y = GROUND_Y + 6 + Math.random() * 14;
            b.w = 2 + Math.random() * 8;
          }
        }
        for (const c of clouds) c.x -= speed * 0.25 + 0.2;
        for (const st of stars) {
          st.x -= speed * 0.08;
          if (st.x < 0) {
            st.x = W + Math.random() * 40;
            st.y = 6 + Math.random() * 80;
          }
        }
        moonX -= speed * 0.05;
        if (moonX < -30) moonX = W + 30;

        // nubes 1-5
        clouds = clouds.filter((c) => c.x > -60);
        if (clouds.length < 5 && Math.random() < 0.012) {
          clouds.push({ x: W + 20, y: 14 + Math.random() * 56 });
        }

        // spawner por distancia 300-600
        distSinceSpawn += speed;
        if (distSinceSpawn >= nextGap) {
          spawnObstacle();
          distSinceSpawn = 0;
          nextGap = 300 + Math.random() * 300;
        }

        // mover obst\u00e1culos + colisi\u00f3n
        const dinoHNow = ducking && onGround ? DUCK_H : STAND_H;
        const dinoWNow = ducking && onGround ? DUCK_W : STAND_W;
        const dx = DINO_X + 5;
        const dy = dinoY + 3;
        const dw = dinoWNow - 10;
        const dh = dinoHNow - 6;

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.x -= speed;
          if (o.x + o.w < -10) {
            obstacles.splice(i, 1);
            continue;
          }
          const ox = o.x + 3;
          const oy = o.y + 2;
          const ow = o.w - 6;
          const oh = o.h - 4;
          if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) {
            // muerte: 1 frame
            dead = true;
            over = true;
            sfxDie();
            if (Math.floor(scoreFloat) > hi) {
              hi = Math.floor(scoreFloat);
              try {
                localStorage.setItem(HI_KEY, String(hi));
              } catch {
                /* sin almacenamiento: no pasa nada */
              }
              setHiUi(hi);
            }
            setGameOver(true);
            break;
          }
        }
      } else if (!started) {
        // idle: deriva suave de nubes
        for (const c of clouds) {
          c.x -= 0.3;
          if (c.x < -60) {
            c.x = W + 20;
            c.y = 14 + Math.random() * 56;
          }
        }
      }
    };

    const render = (): void => {
      const night = isNight();
      const bg = night ? NIGHT_BG : BG;
      const fg = night ? NIGHT_FG : FG;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      if (night) drawMoonStars(fg);
      for (const c of clouds) drawCloud(c, fg);
      drawGround(fg);
      for (const o of obstacles) {
        if (o.kind === "cactus") drawCactus(o, fg);
        else drawPtero(o, fg);
      }
      drawDino(fg);
      if (started) drawHUD(fg);
      else drawIdleHint(fg);
      if (over) drawGameOverPanel(fg);
    };

    const loop = (): void => {
      update();
      render();
      raf = requestAnimationFrame(loop);
    };

    /* ---------------- DPR scaling 600x150 responsive ---------------- */
    const fit = (): void => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);
    loop();

    /* ---------------- inputs ---------------- */
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        ensureAudio();
        startIfIdle();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        ducking = true;
      } else if (e.code === "KeyR") {
        // R reinicia (usa la misma resetGame compartida)
        resetGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent): void => {
      if (e.code === "ArrowDown") ducking = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const toLogical = (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * W,
        y: ((clientY - rect.top) / rect.height) * H,
      };
    };
    const onCanvasClick = (e: MouseEvent): void => {
      ensureAudio();
      const p = toLogical(e.clientX, e.clientY);
      if (over) {
        const b = restartBounds;
        if (p.x >= b.x - 8 && p.x <= b.x + b.w + 8 && p.y >= b.y - 8 && p.y <= b.y + b.h + 8) {
          resetGame();
          return;
        }
        resetGame();
        return;
      }
      startIfIdle();
    };
    canvas.addEventListener("click", onCanvasClick);

    // touch: tap = salto, swipe-down = agachar
    let tsX = 0;
    let tsY = 0;
    let tsT = 0;
    const onTouchStart = (e: TouchEvent): void => {
      ensureAudio();
      const t = e.touches[0];
      tsX = t.clientX;
      tsY = t.clientY;
      tsT = Date.now();
    };
    const onTouchEnd = (e: TouchEvent): void => {
      const t = e.changedTouches[0];
      const dx = t.clientX - tsX;
      const dy = t.clientY - tsY;
      void dx;
      void tsT;
      if (over) {
        resetGame();
        e.preventDefault();
        return;
      }
      if (dy > 28 && Math.abs(dy) > Math.abs(dx)) {
        // swipe-down: agachar 350ms (y fast-fall si est\u00e1 en el aire)
        ducking = true;
        window.setTimeout(() => {
          ducking = false;
        }, 350);
      } else {
        startIfIdle();
      }
      e.preventDefault();
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("click", onCanvasClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      try {
        if (audioCtx) void audioCtx.close();
      } catch {
        /* noop */
      }
      resetFnRef.current = null;
      jumpFnRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const padded = String(scoreUi).padStart(5, "0");
  const hiPadded = String(Math.max(hiUi, scoreUi)).padStart(5, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Minijuego arcade del dinosaurio"
      >
        <div className="relative flex w-full max-w-2xl flex-col items-center rounded-3xl border border-white/10 bg-gray-900 p-6 sm:p-8">
          <button
            onClick={onClose}
            aria-label="Cerrar minijuego"
            className="absolute top-4 right-4 z-[60] rounded-full p-1 text-white/50 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h2 className="text-primary font-display mb-1 text-2xl font-bold tracking-widest uppercase">
            Dino Arcade
          </h2>
          <p className="mb-4 font-mono text-xs text-white/50">
            R\u00e9plica fiel del dino de Chrome &middot; HI {hiPadded} &middot; {padded}
          </p>

          {/* Canvas 600x150, fondo blanco fiel */}
          <div className="w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-2xl">
            <canvas
              ref={canvasRef}
              width={600}
              height={150}
              className="block h-auto w-full cursor-pointer touch-none bg-white select-none"
              role="img"
              aria-label="Juego del dinosaurio. Pulsa Espacio o flecha arriba para saltar, flecha abajo para agacharte y R para reiniciar."
            />
          </div>

          {/* aria-live para lectores de pantalla */}
          <div aria-live="polite" className="sr-only">
            {gameOver
              ? `Fin del juego. Puntuaci\u00f3n ${scoreUi}. Pulsa R o el bot\u00f3n reiniciar para jugar de nuevo.`
              : gameStarted
                ? `Puntuaci\u00f3n ${scoreUi}.`
                : "Pulsa Espacio para empezar."}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => resetFnRef.current?.()}
              aria-label={gameOver ? "Reiniciar juego" : "Reiniciar juego"}
              className="rounded-full bg-white px-6 py-2 font-mono text-sm font-bold text-black transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-white"
            >
              {gameOver ? "Jugar de nuevo (R)" : gameStarted ? "Reiniciar (R)" : "Empezar (Espacio)"}
            </button>
            <button
              onClick={() => setMuted((m) => !m)}
              aria-pressed={muted}
              aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
              className="rounded-full border border-white/20 px-4 py-2 font-mono text-xs text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              {muted ? "🔇 Silenciado" : "🔊 Sonido"}
            </button>
          </div>

          <p className="mt-4 max-w-md text-center font-mono text-[10px] leading-relaxed text-white/30">
            Espacio / ↑ saltar &middot; ↓ agachar (en el aire: ca\u00edda r\u00e1pida) &middot; R
            reiniciar &middot; en m\u00f3vil: tap salta, desliza abajo para agacharte.
            De noche (cada 700 pts) el juego se invierte.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
