import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

/* ====================================================================
   POKE-SLOTS · ARCADE CABINET (Game Boy CRT + 8-bit pixel art)
   Brief: tragaperras 3 carretes jugable dentro de un cabinet arcade.
   Tono: Showa Retro Arcade — marquee rojo, CRT azul curvo, base roja
   con lunares, fondo de rayos amarillos. Referencia: cabinet japonés
   80s + Game Boy Color.
   Tokens: --arc-red #C1121F · --arc-yellow #FFD60A · --arc-orange #FF7B00
   --arc-green #39FF14 · --arc-crt #061C3D · --arc-lime #C6FF5E
   --arc-cream #FFF6D6 · --arc-ink #0B0B10. Radio: 18px cabinet / 10px
   inset. Motion: solo transform + opacity 60fps. Pixel art: SVG inline con
   shapeRendering crispEdges, sin imágenes ni fuentes descargadas.
   Layout: grid 3 cols (side-cabinet-side) centradas verticalmente.
   Laterales: mini cabinets 40% grandes con attract mode vivo.
   Palanca única funcional + BET + SPIN (sin joysticks decorativos).
   FX por tier: win=monedas cayendo · raro=rayos+shake · jackpot=confetti
   +marquee+fanfarria+shake+banner. Recarga +1000 COIN pulsante.
   ==================================================================== */

type SymbolId =
  | 'pikachu'
  | 'charmander'
  | 'squirtle'
  | 'bulbasaur'
  | 'pokeball'
  | 'masterball'
  | 'invader';

interface SymbolDef {
  id: SymbolId;
  name: string;
  pay: number;
  weight: number;
  jackpot: boolean;
}

const SYMBOLS: SymbolDef[] = [
  { id: 'bulbasaur', name: 'Bulbasaur', pay: 1, weight: 20, jackpot: false },
  { id: 'squirtle', name: 'Squirtle', pay: 1, weight: 18, jackpot: false },
  { id: 'charmander', name: 'Charmander', pay: 2, weight: 16, jackpot: false },
  { id: 'pikachu', name: 'Pikachu', pay: 2, weight: 14, jackpot: false },
  { id: 'pokeball', name: 'Poké Ball', pay: 3, weight: 12, jackpot: false },
  { id: 'invader', name: 'Invader', pay: 4, weight: 11, jackpot: false },
  { id: 'masterball', name: 'Master Ball', pay: 8, weight: 9, jackpot: true },
];

/* --------- Economía arcade (interacción, no casino real) ---------
   Los carretes independientes con estos pesos solo darían ~3% de
   triples. Para ~38% de win forzamos el resultado: con prob.
   WIN_RATE elegimos símbolo ganador vía WIN_WEIGHTS (triple),
   si no, tirada perdedora (se re-gira un carrete si sale triple).
   Jackpot absoluto = WIN_RATE * wMaster/sumaWin ≈ 5.4%.
   Sin bonus plano (BONUS=0) el RTP es plano en BET 5/10/25 ≈ 98.6%.
   Cálculo: avgMult = Σ(wWin·pay)/ΣwWin = 275/106 ≈ 2.594;
   RTP = 0.38 × 2.594 ≈ 0.986. Pérdida esperada ≈ 1.4% por giro:
   1000 créditos dan ~7000 giros a BET 10. Sesión larga y divertida. */
const WIN_RATE = 0.38;
const WIN_WEIGHTS: Record<SymbolId, number> = {
  bulbasaur: 26,
  squirtle: 22,
  charmander: 16,
  pikachu: 12,
  pokeball: 9,
  invader: 6,
  masterball: 15,
};

const BY_ID: Record<SymbolId, SymbolDef> = Object.fromEntries(
  SYMBOLS.map((s) => [s.id, s]),
) as Record<SymbolId, SymbolDef>;

/* --------- Tabla de FX por símbolo (tier de premio) --------- */
type WinTier = 'common' | 'rare' | 'jackpot';
const TIER_BY_SYMBOL: Record<SymbolId, WinTier> = {
  bulbasaur: 'common',
  squirtle: 'common',
  charmander: 'common',
  pikachu: 'rare',
  pokeball: 'rare',
  invader: 'rare',
  masterball: 'jackpot',
};
const TIER_META: Record<WinTier, { label: string; fx: string; chip: string }> = {
  common: { label: 'Común', fx: 'destello verde + monedas', chip: 'border-[#39ff14]/40 text-[#39ff14]' },
  rare: { label: 'Raro', fx: 'rayos + shake medio', chip: 'border-[#38bdf8]/50 text-[#38bdf8]' },
  jackpot: { label: 'Jackpot', fx: 'confetti + marquee + fanfarria + shake fuerte', chip: 'border-[#ffd60a]/60 text-[#ffd60a]' },
};

const BETS = [5, 10, 25] as const;
const LS_CREDITS = 'poke-slots:credits:v1';
const LS_BET = 'poke-slots:bet:v1';
const LS_MUTED = 'poke-slots:muted:v1';
const LS_LASTWIN = 'poke-slots:lastwin:v1';
const START_CREDITS = 1000;
const JACKPOT_BONUS = 0;

interface HistoryEntry {
  n: number;
  faces: SymbolId[];
  bet: number;
  win: number;
  jackpot: boolean;
}

function readNum(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

function randomFace(): SymbolId {
  const total = SYMBOLS.reduce((a, s) => a + s.weight, 0);
  let r: number;
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    r = (buf[0] / 4294967296) * total;
  } catch {
    r = Math.random() * total;
  }
  let acc = 0;
  for (const s of SYMBOLS) {
    acc += s.weight;
    if (r < acc) return s.id;
  }
  return 'bulbasaur';
}

function pickWinSymbol(): SymbolId {
  const entries = Object.entries(WIN_WEIGHTS) as Array<[SymbolId, number]>;
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r: number;
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    r = (buf[0] / 4294967296) * total;
  } catch {
    r = Math.random() * total;
  }
  let acc = 0;
  for (const [id, w] of entries) {
    acc += w;
    if (r < acc) return id;
  }
  return 'bulbasaur';
}

/* Tirada rigged para arcade divertido: 38% triple, resto perdedor
   garantizado (re-gira el 3er carrete si cae triple accidental). */
function rollFinal(): SymbolId[] {
  const roll = (): SymbolId[] => [randomFace(), randomFace(), randomFace()];
  let forceWin = false;
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    forceWin = buf[0] / 4294967296 < WIN_RATE;
  } catch {
    forceWin = Math.random() < WIN_RATE;
  }
  if (forceWin) {
    const s = pickWinSymbol();
    return [s, s, s];
  }
  const losing = roll();
  if (losing[0] === losing[1] && losing[1] === losing[2]) {
    const alt = SYMBOLS.filter((s) => s.id !== losing[0]);
    losing[2] = alt[Math.floor(Math.random() * alt.length)].id;
  }
  return losing;
}

/* ---------------- Pixel art 12x12 (SVG crispEdges) ------------------ */

const PALETTE: Record<string, string> = {
  K: '#15151f',
  W: '#ffffff',
  Y: '#ffd500',
  R: '#ff3b30',
  O: '#ff8c1a',
  G: '#4ade80',
  D: '#166534',
  B: '#38bdf8',
  N: '#0b3b8f',
  P: '#a855f7',
  M: '#e9d5ff',
  X: '#39ff14',
  S: '#ffcf9e',
  E: '#7c3f12',
};

const PIXELS: Record<SymbolId, string[]> = {
  pikachu: [
    'KK........KK',
    'KYK......KYK',
    'KYYK....KYYK',
    '.KYYKKKKYYK.',
    '.KYYYYYYYYK.',
    '.KYKYYYYKYK.',
    '.KYYYYYYYYK.',
    '..KRRYYRRK..',
    '..KYYYYYYK..',
    '..KYYKKYYK..',
    '...KYYYYK...',
    '....KKKK....',
  ],
  charmander: [
    '.....YY.....',
    '....YRRY....',
    '....YRRY....',
    '.....YY.....',
    '..KKKKKKKK..',
    '.KOOOOOOOOK.',
    '.KOOKOOKOOK.',
    '.KOOOOOOOOK.',
    '.KROOOOOORK.',
    '..KOOOOOOK..',
    '..KOKKKKOK..',
    '...KKKKKK...',
  ],
  squirtle: [
    '.....WW.....',
    '....WBBW....',
    '....WBBW....',
    '.....BB.....',
    '..KKKKKKKK..',
    '.KBBBBBBBBK.',
    '.KBBOOKBOOK.',
    '.KBBBBBBBBK.',
    '.KBBOOOOBBK.',
    '..KBBBBBBK..',
    '..KBKBBKBK..',
    '...KKKKKK...',
  ],
  bulbasaur: [
    '....GGGG....',
    '..GGGGGGGG..',
    '..GGDGGDGG..',
    '...GGGGGG...',
    '..KKKKKKKK..',
    '.KGGGGGGGGK.',
    '.KGGKGGKGGK.',
    '.KGGGGGGGGK.',
    '.KGKGGGGKGK.',
    '..KGGGGGGK..',
    '..KGKGGKGK..',
    '...KKKKKK...',
  ],
  pokeball: [
    '...KKKKKK...',
    '..KRRRRRRK..',
    '.KRRRWRRRRK.',
    '.KRRWWRRRRK.',
    'KRRRRRRRRRRK',
    'KKKKKKKKKKKK',
    'KWWWBBBBWWWK',
    'KWWWWBBBBWWK',
    'KWWWWWWWWWWK',
    '.KWWWWWWWWK.',
    '..KWWWWWWK..',
    '...KKKKKK...',
  ],
  masterball: [
    '...KKKKKK...',
    '..KPPPPPPK..',
    '.KPPMMPPMPK.',
    '.KPMPPPPMPK.',
    'KPPPPPPPPPPK',
    'KKKKKKKKKKKK',
    'KWWWBBBBWWWK',
    'KWWWWBBBBWWK',
    'KWWWWWWWWWWK',
    '.KWWWWWWWWK.',
    '..KWWWWWWK..',
    '...KKKKKK...',
  ],
  invader: [
    '............',
    '..X.....X...',
    '...X...X....',
    '..XXXXXXX...',
    '.XX.XXX.XX..',
    'XXXXXXXXXXX.',
    'X.XXXXXXX.X.',
    'X.X.....X.X.',
    '...XX.XX....',
    '............',
    '............',
    '............',
  ],
};

const SHIP: string[] = [
  '.....R......',
  '....RRR.....',
  '....RRR.....',
  '...RRRRR....',
  '..RRRWRRR...',
  '.RRRWWWRRR..',
  'RRRRWWWRRRR.',
  'RRRRWWWRRRR.',
  '.KKKKKKKKK..',
  '............',
  '............',
  '............',
];

const COIN_MAP: string[] = [
  '..YYYY..',
  '.YYYYYY.',
  'YYWWYYYY',
  'YWYYYYYY',
  'YWYYYYYY',
  'YYWWYYYY',
  '.YYYYYY.',
  '..YYYY..',
];

const BOLT_MAP: string[] = [
  '...Y...',
  '..YY...',
  '..YY...',
  '.YYY...',
  '.YYY...',
  'YYYYYY.',
  '..YY...',
  '..YY...',
  '.YYY...',
  '.YYY...',
  'YYYY...',
  '.......',
];

const MARIO_A: string[] = [
  '....RRRRR...',
  '...RRRRRRRR.',
  '...SSKSSK...',
  '...SSSSSS...',
  '...RRBBB....',
  '..RRRBBBB...',
  '..SSBBBBB...',
  '..SSBBBB....',
  '...BBBBB....',
  '..BBB.BBB...',
  '.EBB...EBB..',
  '.EEE...EEE..',
];

const MARIO_B: string[] = [
  '....RRRRR...',
  '...RRRRRRRR.',
  '...SSKSSK...',
  '...SSSSSS...',
  '...RRBBB....',
  '..RRRBBBB...',
  '..SSBBBBB...',
  '..SSBBBB....',
  '...BBBBB....',
  '...BB.BB....',
  '..EBB.BBE...',
  '............',
];

const GOOMBA_MAP: string[] = [
  '............',
  '..EEEEEE....',
  '.EEEEEEEE...',
  'EEKEEEEEKE..',
  'EEEEEEEEEE..',
  '.EEEEEEEE...',
  '..EEEEEE....',
  '...E..E.....',
  '..KK..KK....',
  '............',
  '............',
  '............',
];

const BOOM_MAP: string[] = [
  '..Y..Y..',
  '...YY...',
  '.YWYYY..',
  '..YYYYY.',
  'YYYWYYY.',
  '..YYYYY.',
  '.YYWYY..',
  '...YY...',
  '..Y..Y..',
];

const PAC_OPEN: string[] = [
  '....YYYY....',
  '..YYYYYYYY..',
  '.YYYYYYYYYY.',
  '.YYYYYYYYYY.',
  'YYYYYYKKKK..',
  'YYYYYYKKKK..',
  'YYYYYY......',
  '.YYYYYYY....',
  '.YYYYYYYY...',
  '.YYYYYYYYYY.',
  '..YYYYYYYY..',
  '....YYYY....',
];

const PAC_CLOSED: string[] = [
  '....YYYY....',
  '..YYYYYYYY..',
  '.YYYYYYYYYY.',
  '.YYYYYKYYYY.',
  'YYYYYYYKYYY.',
  'YYYYYYYYYYY.',
  'YYYYYYYYYYY.',
  'YYYYYYYYYYY.',
  '.YYYYYYYYY..',
  '.YYYYYYYYY..',
  '..YYYYYYYY..',
  '....YYYY....',
];

const GHOST_R: string[] = [
  '....RRRR....',
  '..RRRRRRRR..',
  '.RRRRRRRRRR.',
  '.RWWRRRRWWR.',
  '.RWWRRRRWWR.',
  'RRRRRRRRRRRR',
  'RRRRRRRRRRRR',
  'RRRRRRRRRRRR',
  'RRRRRRRRRRRR',
  'RRRRRRRRRRRR',
  'RKRKRKRKRKRK',
  '............',
];

const GHOST_P: string[] = [
  '....PPPP....',
  '..PPPPPPPP..',
  '.PPPPPPPPPP.',
  '.PWWPPPPWWP.',
  '.PWWPPPPWWP.',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  'PPPPPPPPPPPP',
  'PKPKPKPKPKPK',
  '............',
];

const GHOST_C: string[] = [
  '....BBBB....',
  '..BBBBBBBB..',
  '.BBBBBBBBBB.',
  '.BWWBBBBWWB.',
  '.BWWBBBBWWB.',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BBBBBBBBBBBB',
  'BKBKBKBKBKBK',
  '............',
];

function PixelSprite({
  map,
  label,
  className,
}: {
  map: string[];
  label: string;
  className?: string;
}) {
  const h = map.length;
  const w = Math.max(...map.map((r) => r.length));
  return (
    <svg
      viewBox={`-0.5 -0.5 ${w + 1} ${h + 1}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {map.map((row, y) =>
        row.split('').map((ch, x) => {
          if (ch === '.') return null;
          const fill = PALETTE[ch] ?? '#fff';
          return <rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} fill={fill} />;
        }),
      )}
    </svg>
  );
}

function SymbolPixel({ id, className }: { id: SymbolId; className?: string }) {
  return <PixelSprite map={PIXELS[id]} label={BY_ID[id].name} className={className} />;
}

/* ---------------- Confetti / monedas pixel -------------------------- */

interface Confetto {
  left: number;
  delay: number;
  dur: number;
  size: number;
  color: string;
}
const CONFETTI = ['#ffd60a', '#ff3b30', '#39ff14', '#38bdf8', '#ffffff', '#a855f7'];

/* ---------------- Palanca principal premium (única, funcional) --------
   Base metálica con anillo + eje cromado + bola roja glossy.
   Tilt con spring + rebote + glow + clac al soltar. Solo transform/opacity. */

function Lever({
  onPull,
  disabled,
  spinning,
  reduce,
  pulled,
  dragY,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  onPull: () => void;
  disabled: boolean;
  spinning: boolean;
  reduce: boolean;
  pulled: boolean;
  dragY: number;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const clamped = Math.max(0, Math.min(72, dragY));
  const tilt = reduce ? 0 : pulled ? 38 : clamped * 0.72;
  const drop = reduce ? 0 : pulled ? 20 : clamped * 0.42;
  const glow = reduce ? 0 : pulled ? 1 : Math.min(1, clamped / 44);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (!disabled) onPull();
    }
  };

  return (
    <div className="flex select-none flex-col items-center gap-2">
      {/* riel con escala */}
      <div aria-hidden="true" className="relative h-40 w-[84px]">
        {/* halo glow al tirar (solo opacity) */}
        <span
          className="absolute -inset-3 rounded-3xl bg-[#ff3b30]/45 blur-lg"
          style={{ opacity: glow * 0.95 }}
        />
        {/* riel */}
        <span className="absolute left-1/2 top-1 h-[118px] w-[18px] -translate-x-1/2 rounded-full border-2 border-black bg-[#0b0b10]" />
        <span className="absolute left-1/2 top-2 h-[114px] w-[6px] -translate-x-1/2 rounded-full bg-white/10" />
        <span className="absolute left-1/2 top-2 h-[114px] w-[2px] -translate-x-[3px] rounded-full bg-white/25" />
        {/* escala lateral */}
        <span className="absolute right-[9px] top-2 flex h-[118px] flex-col justify-between py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block rounded-full bg-[#ffd60a]"
              style={{
                width: i === 4 ? 12 : 8,
                height: 2,
                opacity: 0.35 + glow * 0.65,
                boxShadow: glow > 0.25 ? '0 0 6px rgba(255,214,10,.9)' : 'none',
              }}
            />
          ))}
        </span>
        <span className="absolute left-[9px] top-2 flex h-[118px] flex-col justify-between py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="block h-[2px] w-2 rounded-full bg-white/25" />
          ))}
        </span>
        {/* placa base metálica */}
        <span
          className="absolute inset-x-0 bottom-0 block h-11 rounded-[12px] border-2 border-black"
          style={{
            background: 'linear-gradient(180deg,#f4f4f6 0%,#b9bcc7 22%,#6b6f7d 48%,#2b2d36 72%,#101016 100%)',
            boxShadow: '0 4px 0 #0b0b10, 0 8px 18px rgba(0,0,0,.6), inset 0 2px 2px rgba(255,255,255,.8)',
          }}
        >
          {/* tornillos */}
          <span className="absolute left-1.5 top-1.5 block h-2 w-2 rounded-full border border-black/70 bg-[#2b2d36]" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,.6)' }} />
          <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full border border-black/70 bg-[#2b2d36]" style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,.6)' }} />
          {/* anillo */}
          <span
            className="absolute left-1/2 top-1/2 block h-6 w-12 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-black"
            style={{ background: 'radial-gradient(ellipse at 50% 35%, #e8e9ee, #55555f 60%, #0b0b10 90%)' }}
          >
            <span className="absolute left-1/2 top-1/2 block h-3 w-7 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-black" />
          </span>
        </span>
      </div>
      <button
        type="button"
        onClick={onPull}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-label={
          spinning
            ? 'Girando carretes'
            : 'Tirar de la palanca para girar. Arrastra hacia abajo o pulsa flecha abajo.'
        }
        title="Tira de la palanca (arrastra ↓ o flecha ↓)"
        className="-mt-40 flex min-h-[72px] min-w-[72px] cursor-grab touch-none flex-col items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00ffcc] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
        style={{ touchAction: 'none' }}
      >
        {/* bola roja glossy grande */}
        <motion.span
          aria-hidden="true"
          className="relative block h-14 w-14 rounded-full border-4 border-black"
          animate={reduce ? {} : { rotate: tilt, y: drop, scale: pulled || clamped > 4 ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 170, damping: 6.5, mass: 1.05 }}
          style={{
            background:
              'radial-gradient(circle at 32% 26%, #ffffff 0 10%, #ffb3ab 17%, #ff5a52 30%, #c1121f 56%, #5c0a0a 82%, #0b0b10 140%)',
            boxShadow: `0 0 0 2px rgba(255,255,255,.15), 0 6px 0 #0b0b10, 0 12px 22px rgba(0,0,0,.65), 0 0 ${12 + glow * 30}px rgba(255,59,48,${0.4 + glow * 0.55})`,
            transformOrigin: '50% 90%',
          }}
        >
          {/* brillo especular */}
          <span
            className="absolute left-[14%] top-[10%] block h-[38%] w-[30%] rounded-full bg-white"
            style={{ filter: 'blur(0.5px)', opacity: 0.95 }}
          />
          <span className="absolute bottom-[12%] right-[16%] block h-[18%] w-[26%] rounded-[50%] bg-white/35" style={{ filter: 'blur(1px)' }} />
        </motion.span>
        {/* eje cromado */}
        <motion.span
          aria-hidden="true"
          className="relative block w-[18px] rounded-b-lg rounded-t-sm border-x-2 border-b-2 border-black/70"
          animate={reduce ? {} : { rotate: tilt * 0.6, y: drop * 0.6, scaleY: pulled || clamped > 4 ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 170, damping: 7, mass: 1 }}
          style={{
            height: 78,
            transformOrigin: '50% 0%',
            background: 'linear-gradient(90deg,#f8fafc 0%,#cbd5e1 18%,#64748b 42%,#f1f5f9 52%,#475569 72%,#0f172a 100%)',
            boxShadow: '0 4px 8px rgba(0,0,0,.55)',
          }}
        >
          <span className="absolute left-[3px] top-0 block h-full w-[3px] rounded-full bg-white/70" />
        </motion.span>
        {/* pivote */}
        <span
          aria-hidden="true"
          className="block h-4 w-12 rounded-[50%] border-2 border-black/80"
          style={{ background: 'radial-gradient(ellipse at 50% 30%, #9aa0ae, #0b0b10 78%)' }}
        />
      </button>
      <span
        className="font-pixel text-xs font-bold tracking-[0.3em] text-[#FFE45E]"
        style={{ textShadow: '1px 1px 0 #000, 0 0 12px rgba(255,214,10,.6)' }}
      >
        {spinning ? '···' : 'TIRA ↓'}
      </span>
    </div>
  );
}

/* ---------------- Mini cabinets laterales (4 attract modes) ------------
   Galaga (nave+invaders+balas) · Mario (run+jump+monedas) ·
   Pac-Man (laberinto+fantasmas+pellets) · Tetris (piezas+líneas).
   Solo transform/opacity. Marquee propio + CRT scanlines. */

type MiniVariant = 'galaga' | 'mario' | 'pacman' | 'tetris';

const MINI_META: Record<MiniVariant, { title: string; sub: string; marquee: string }> = {
  galaga: { title: 'GALAGA', sub: 'HI 99990', marquee: 'linear-gradient(180deg,#2f4fe0,#101c5e)' },
  mario: { title: 'MARIO', sub: 'W1-1  ×3', marquee: 'linear-gradient(180deg,#ef4444,#8f0d18)' },
  pacman: { title: 'PAC-MAN', sub: 'HI 16470', marquee: 'linear-gradient(180deg,#7c2d12,#1a0b00)' },
  tetris: { title: 'TETRIS', sub: 'LV9  LINES 12', marquee: 'linear-gradient(180deg,#7e22ce,#2e1065)' },
};

function MiniCabinet({
  variant,
  reduce: _reduce,
  slow = false,
}: {
  variant: MiniVariant;
  reduce: boolean;
  slow?: boolean;
}) {
  /* Decorativo y aria-hidden (SideColumn y carrusel móvil lo marcan así):
     el attract mode SIEMPRE anima con CSS puro (sin framer-motion).
     Bajo prefers-reduced-motion no se congela: el bloque slow del <style>
     + la resurrección en index.css lo ralentizan (seguro, solo
     transform/opacity). _reduce se conserva solo por compatibilidad. */
  void _reduce;
  const meta = MINI_META[variant];
  return (
    <div className="w-[172px] shrink-0 snap-center overflow-hidden rounded-[12px] border-4 border-black bg-[#141419] shadow-[0_18px_50px_rgba(0,0,0,.65)]">
      {/* marquee mini con chase */}
      <div className="border-b-[3px] border-black px-2 pb-1.5 pt-2" style={{ background: meta.marquee }}>
        <div aria-hidden="true" className="mb-1.5 flex items-center justify-center gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i % 2 ? 'bg-white' : 'bg-[#ffd60a]'} arc-chase`}
              style={{
                animationDelay: `${(i + (slow ? 4 : 0)) * 0.14}s`,
                boxShadow: i % 2 ? '0 0 6px #fff' : '0 0 6px #ffd60a',
              }}
            />
          ))}
        </div>
        <p
          className="font-pixel text-center text-[10px] tracking-[0.25em] text-[#FFE45E]"
          style={{ textShadow: '1px 1px 0 #000, 0 0 12px rgba(255,214,10,.7)' }}
        >
          {meta.title}
        </p>
      </div>
      {/* pantalla CRT pequeña */}
      <div className="bg-black p-1.5">
        <div
          className="relative h-[134px] overflow-hidden rounded-[8px] border-2 border-black"
          style={{
            background:
              variant === 'galaga'
                ? 'linear-gradient(180deg,#0d1b4c 0%,#061c3d 60%,#020617 100%)'
                : variant === 'mario'
                  ? 'linear-gradient(180deg,#38bdf8 0%,#0ea5e9 52%,#14532d 53%,#166534 100%)'
                  : variant === 'pacman'
                    ? 'linear-gradient(180deg,#05051a 0%,#0b0b2e 70%,#000 100%)'
                    : 'linear-gradient(180deg,#0f0b26 0%,#131033 60%,#020617 100%)',
          }}
        >
          <div aria-hidden="true" className="arc-scan pointer-events-none absolute inset-0 z-20 opacity-70" />
          <div aria-hidden="true" className="arc-crt pointer-events-none absolute inset-0 z-20 bg-white" />
          {variant === 'galaga' && (
            <>
              <p className="font-pixel absolute left-1.5 right-1.5 top-1.5 z-10 text-center text-[7px] tracking-[0.2em] text-[#C6FF5E]">
                {meta.sub}
              </p>
              <>
                <span aria-hidden="true" className="arc-star absolute left-[18%] top-4 z-0 block h-1 w-1 rounded-full bg-white/80" />
                <span aria-hidden="true" className="arc-star absolute left-[72%] top-8 z-0 block h-1 w-1 rounded-full bg-white/60" style={{ animationDelay: '0.9s' }} />
                <span aria-hidden="true" className="arc-star absolute left-[45%] top-2 z-0 block h-[3px] w-[3px] rounded-full bg-[#7dd3fc]/80" style={{ animationDelay: '1.6s' }} />
              </>
              <div className="absolute left-1/2 top-7 z-10 flex -translate-x-1/2 gap-2 arc-galaga-inv">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="inline-block">
                    <PixelSprite map={PIXELS.invader} label="" className="h-7 w-7 opacity-95" />
                  </span>
                ))}
              </div>
              <div
                className="absolute left-1/2 top-[62px] z-10 flex -translate-x-1/2 gap-3 arc-galaga-inv"
                style={{ animationDelay: '-1.4s' }}
              >
                {[0, 1].map((i) => (
                  <span key={i} className="inline-block">
                    <PixelSprite map={PIXELS.invader} label="" className="h-5 w-5 opacity-75" />
                  </span>
                ))}
              </div>
              <>
                <span aria-hidden="true" className="arc-bullet absolute bottom-10 left-[34%] z-10 block h-3 w-[3px] bg-[#ffd60a]" style={{ boxShadow: '0 0 6px #ffd60a' }} />
                <span aria-hidden="true" className="arc-bullet absolute bottom-10 left-[50%] z-10 block h-3 w-[3px] bg-white" style={{ animationDelay: '0.36s' }} />
                <span aria-hidden="true" className="arc-bullet absolute bottom-10 left-[64%] z-10 block h-3 w-[3px] bg-[#ff3b30]" style={{ animationDelay: '0.72s', boxShadow: '0 0 6px #ff3b30' }} />
                <span aria-hidden="true" className="arc-boom absolute left-[30%] top-6 z-10 block">
                  <PixelSprite map={BOOM_MAP} label="" className="h-6 w-6" />
                </span>
                <span aria-hidden="true" className="arc-boom absolute left-[58%] top-9 z-10 block" style={{ animationDelay: '0.55s' }}>
                  <PixelSprite map={BOOM_MAP} label="" className="h-5 w-5" />
                </span>
              </>
              <div className="absolute bottom-2 left-1/2 z-10 arc-galaga-ship">
                <PixelSprite map={SHIP} label="" className="h-8 w-8" />
              </div>
            </>
          )}
          {variant === 'mario' && (
            <>
              <p className="font-pixel absolute left-1.5 top-1.5 z-10 text-[7px] tracking-[0.15em] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                {meta.sub}
              </p>
              <div aria-hidden="true" className="absolute left-2 right-2 top-6 z-10 flex justify-between px-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block arc-coin-spin" style={{ animationDelay: `${i * 0.22}s` }}>
                    <PixelSprite map={COIN_MAP} label="" className="h-5 w-5" />
                  </span>
                ))}
              </div>
              <div aria-hidden="true" className="absolute left-2 right-2 top-12 z-10 flex justify-between">
                <span className="block h-4 w-4 border border-black/70 bg-[#ffd60a]" style={{ boxShadow: 'inset -1px -1px 0 #9a7b00' }} />
                <span className="block h-4 w-4 border border-black/70 bg-[#ff8c1a]" />
                <span className="block h-4 w-4 border border-black/70 bg-[#ffd60a]" style={{ boxShadow: 'inset -1px -1px 0 #9a7b00' }} />
              </div>
              <div aria-hidden="true" className="absolute bottom-4 right-2 z-10 h-10 w-5 border border-black/70 bg-[#4ade80]" style={{ boxShadow: 'inset -2px 0 0 #166534' }} />
              <div className="absolute bottom-4 left-0 z-10 arc-mario-run">
                <div className="arc-mario-jump">
                  <span className="block arc-frame-a">
                    <PixelSprite map={MARIO_A} label="" className="h-10 w-10" />
                  </span>
                  <span aria-hidden="true" className="arc-frame-b -mt-10 block">
                    <PixelSprite map={MARIO_B} label="" className="h-10 w-10" />
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 z-10 arc-goomba">
                <PixelSprite map={GOOMBA_MAP} label="" className="h-7 w-7" />
              </div>
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-4 border-t-2 border-black/70" style={{ background: 'repeating-linear-gradient(90deg,#7c3f12 0 6px,#166534 6px 8px)' }} />
            </>
          )}
          {variant === 'pacman' && (
            <>
              <p className="font-pixel absolute left-1.5 right-1.5 top-1.5 z-10 text-center text-[7px] tracking-[0.2em] text-[#FFE45E]" style={{ textShadow: '1px 1px 0 #000' }}>
                {meta.sub}
              </p>
              {/* laberinto */}
              <div aria-hidden="true" className="absolute inset-x-2 top-7 bottom-3 z-0 rounded-md border-2 border-[#2f4fe0] bg-black/40">
                <span className="absolute left-2 right-2 top-5 block h-[2px] bg-[#2f4fe0]/80" />
                <span className="absolute left-2 right-2 top-10 block h-[2px] bg-[#2f4fe0]/60" />
                <span className="absolute left-1/2 top-2 bottom-2 block w-[2px] bg-[#2f4fe0]/60" />
              </div>
              {/* pellets */}
              <div aria-hidden="true" className="absolute inset-x-4 top-[52px] z-10 flex justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="block h-1 w-1 rounded-full bg-[#ffd6a5] arc-pellet"
                    style={{ animationDelay: `${i * 0.28}s` }}
                  />
                ))}
              </div>
              <div aria-hidden="true" className="absolute inset-x-4 top-[76px] z-10 flex justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="block h-1 w-1 rounded-full bg-[#ffd6a5] arc-pellet"
                    style={{ animationDelay: `${0.4 + i * 0.28}s` }}
                  />
                ))}
              </div>
              {/* power pellet */}
              <span aria-hidden="true" className="absolute right-4 top-9 z-10 block h-2 w-2 rounded-full bg-white arc-power" style={{ boxShadow: '0 0 8px #fff' }} />
              {/* pac corriendo */}
              <div className="absolute bottom-[26px] left-2 z-10 arc-pac-run">
                <span className="block arc-frame-a">
                  <PixelSprite map={PAC_OPEN} label="" className="h-7 w-7" />
                </span>
                <span aria-hidden="true" className="arc-frame-b -mt-7 block">
                  <PixelSprite map={PAC_CLOSED} label="" className="h-7 w-7" />
                </span>
              </div>
              {/* fantasmas en persecución */}
              <div className="absolute bottom-[26px] left-2 z-10 arc-ghost-a">
                <PixelSprite map={GHOST_R} label="" className="h-7 w-7" />
              </div>
              <div
                className="absolute bottom-[26px] left-2 z-10 arc-ghost-b"
                style={{ animationDelay: slow ? '-1.2s' : '-0.6s' }}
              >
                <PixelSprite map={GHOST_C} label="" className="h-6 w-6 opacity-90" />
              </div>
              <div aria-hidden="true" className="arc-ghost-b absolute bottom-[64px] left-2 z-10" style={{ animationDelay: '-1.8s' }}>
                <PixelSprite map={GHOST_P} label="" className="h-5 w-5 opacity-70" />
              </div>
            </>
          )}
          {variant === 'tetris' && (
            <>
              <p className="font-pixel absolute left-1.5 right-1.5 top-1.5 z-10 text-center text-[7px] tracking-[0.18em] text-[#E9D5FF]" style={{ textShadow: '1px 1px 0 #000' }}>
                {meta.sub}
              </p>
              {/* pozo */}
              <div aria-hidden="true" className="absolute bottom-2 left-1/2 top-7 z-0 w-[92px] -translate-x-1/2 rounded-sm border-2 border-[#7e22ce] bg-black/60">
                <span className="absolute inset-0 block opacity-40" style={{ background: 'repeating-linear-gradient(0deg,transparent 0 9px,rgba(126,34,206,.35) 9px 10px),repeating-linear-gradient(90deg,transparent 0 9px,rgba(126,34,206,.35) 9px 10px)' }} />
              </div>
              {/* stack inferior */}
              <div aria-hidden="true" className="absolute bottom-[10px] left-1/2 z-10 grid -translate-x-1/2 grid-cols-6 gap-[2px]">
                {[
                  '#ffd60a', '#ffd60a', '#38bdf8', '#38bdf8', '#ff3b30', '#ff3b30',
                  '#39ff14', '#39ff14', '#39ff14', '#a855f7', '#a855f7', '#a855f7',
                ].map((c, i) => (
                  <span key={i} className="block h-[9px] w-[9px] rounded-[2px] border border-black/70" style={{ background: c }} />
                ))}
              </div>
              {/* línea que se limpia (flash) */}
              <div aria-hidden="true" className="absolute bottom-[32px] left-1/2 z-10 grid -translate-x-1/2 grid-cols-6 gap-[2px] arc-tetris-clear">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="block h-[9px] w-[9px] rounded-[2px] border border-black/70 bg-white" style={{ boxShadow: '0 0 8px #fff' }} />
                ))}
              </div>
              {/* piezas cayendo */}
              <>
                <div aria-hidden="true" className="arc-tetris-fall absolute left-1/2 top-7 z-10 -ml-5">
                  <span className="block h-[10px] w-[10px] rounded-[2px] border border-black/70 bg-[#38bdf8]" />
                  <span className="block h-[10px] w-[30px] rounded-[2px] border border-black/70 bg-[#38bdf8]" />
                </div>
                <div aria-hidden="true" className="arc-tetris-fall-b absolute left-1/2 top-7 z-10 -ml-3" style={{ animationDelay: '1.4s' }}>
                  <span className="flex">
                    <span className="block h-[10px] w-[10px] rounded-[2px] border border-black/70 bg-[#ffd60a]" />
                    <span className="block h-[10px] w-[10px] rounded-[2px] border border-black/70 bg-[#ffd60a]" />
                  </span>
                  <span className="flex">
                    <span className="block h-[10px] w-[10px] rounded-[2px] border border-black/70 bg-[#ffd60a]" />
                    <span className="block h-[10px] w-[10px] rounded-[2px] border border-black/70 bg-[#ffd60a]" />
                  </span>
                </div>
              </>
            </>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20"
            style={{ boxShadow: 'inset 0 0 16px rgba(0,0,0,.8)' }}
          />
        </div>
      </div>
      {/* base */}
      <div className="relative border-t-[3px] border-black bg-[#c1121f] px-2 py-1.5 text-center">
        <p className="font-pixel text-[7px] tracking-[0.25em] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
          1UP · DEMO
        </p>
      </div>
    </div>
  );
}

function SideColumn({ side, reduce }: { side: 'left' | 'right'; reduce: boolean }) {
  const pair: MiniVariant[] = side === 'left' ? ['galaga', 'pacman'] : ['mario', 'tetris'];
  return (
    <div aria-hidden="true" className="hidden w-[200px] flex-col items-center justify-center gap-7 lg:flex">
      <p className="font-pixel text-[11px] tracking-[0.35em] text-[#FFE45E] opacity-90 [writing-mode:vertical-rl]" style={{ textShadow: '1px 1px 0 #000' }}>
        {side === 'left' ? 'HI-SCORE 999900' : 'INSERT COIN'}
      </p>
      {pair.map((v, i) => (
        <span key={`${side}-${v}`} className="block">
          <MiniCabinet variant={v} reduce={reduce} slow={i === 1} />
        </span>
      ))}
      <div className="flex flex-col items-center gap-2 opacity-70">
        <span className="block h-10 w-1 rounded-full bg-[#ffd60a]/60" />
        <span className="block h-2.5 w-2.5 rounded-full bg-[#ff3b30]" />
      </div>
    </div>
  );
}

/* ============================== COMPONENTE =========================== */

export default function PokemonSlots() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion() === true;
  const isInView = useInView(ref as never, { once: true } as never) as boolean;

  const [credits, setCredits] = useState<number>(() => readNum(LS_CREDITS, START_CREDITS));
  const [bet, setBet] = useState<number>(() => {
    const b = readNum(LS_BET, 10);
    return (BETS as readonly number[]).includes(b) ? b : 10;
  });
  const [reels, setReels] = useState<SymbolId[]>(() => [randomFace(), randomFace(), randomFace()]);
  const [locked, setLocked] = useState<boolean[]>([true, true, true]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('PULSA SPIN · CONSIGUE 3 IGUALES.');
  const [lastWin, setLastWin] = useState<number>(() => readNum(LS_LASTWIN, 0));
  const [jackpot, setJackpot] = useState(false);
  const [winTier, setWinTier] = useState<WinTier | null>(null);
  const [winKey, setWinKey] = useState(0);
  const [shake, setShake] = useState<'idle' | 'spin' | 'rare' | 'jackpot'>('idle');
  const [leverPulled, setLeverPulled] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_MUTED) === '1';
    } catch {
      return false;
    }
  });
  const [spinCount, setSpinCount] = useState(0);

  const mutedRef = useRef(muted);
  const audioRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragStartY = useRef<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    mutedRef.current = muted;
    try {
      localStorage.setItem(LS_MUTED, muted ? '1' : '0');
    } catch {
      /* noop */
    }
  }, [muted]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CREDITS, String(credits));
    } catch {
      /* noop */
    }
  }, [credits]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_BET, String(bet));
      localStorage.setItem(LS_LASTWIN, String(lastWin));
    } catch {
      /* noop */
    }
  }, [bet, lastWin]);

  useEffect(() => {
    const iv = intervalRef.current;
    const tos = timeoutsRef.current;
    return () => {
      if (iv) clearInterval(iv);
      tos.forEach((t) => clearTimeout(t));
      try {
        if (audioRef.current) void audioRef.current.close();
      } catch {
        /* noop */
      }
    };
  }, []);

  const ensureAudio = useCallback((): AudioContext | null => {
    try {
      if (!audioRef.current) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        audioRef.current = new AC();
      }
      if (audioRef.current.state === 'suspended') void audioRef.current.resume();
      return audioRef.current;
    } catch {
      return null;
    }
  }, []);

  /* Chiptune: ondas cuadradas/triangulares, sin assets */
  const tone = useCallback(
    (f0: number, f1: number, dur: number, type: OscillatorType, vol = 0.05, delay = 0): void => {
      if (mutedRef.current) return;
      const ac = ensureAudio();
      if (!ac) return;
      try {
        const t0 = ac.currentTime + delay;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(1, f0), t0);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch {
        /* audio opcional */
      }
    },
    [ensureAudio],
  );

  const sfxSpin = useCallback(() => {
    tone(140, 880, 0.28, 'sawtooth', 0.035);
    tone(70, 440, 0.28, 'square', 0.02, 0.02);
    [0.15, 0.3, 0.45, 0.6].forEach((d) => tone(220, 330, 0.05, 'square', 0.025, d));
  }, [tone]);
  /* Clac metálico de palanca al soltar: click agudo + golpe grave */
  const sfxClack = useCallback(() => {
    tone(1500, 320, 0.06, 'square', 0.06);
    tone(190, 85, 0.09, 'square', 0.055, 0.015);
    tone(90, 60, 0.12, 'triangle', 0.05, 0.02);
  }, [tone]);
  const sfxStop = useCallback(() => tone(660, 660, 0.06, 'square', 0.05), [tone]);
  const sfxBet = useCallback(() => tone(440, 880, 0.08, 'square', 0.04), [tone]);
  const sfxCommon = useCallback(() => {
    [659, 784, 1046].forEach((f, i) => tone(f, f, 0.11, 'square', 0.05, i * 0.085));
    tone(1318, 1318, 0.14, 'triangle', 0.035, 0.27);
  }, [tone]);
  const sfxRare = useCallback(() => {
    [392, 523, 659, 784, 1046, 784].forEach((f, i) => tone(f, f * 1.01, 0.11, 'sawtooth', 0.045, i * 0.09));
    tone(1568, 2093, 0.22, 'square', 0.04, 0.56);
  }, [tone]);
  const sfxWin = sfxCommon;
  const sfxJackpot = useCallback(() => {
    [523, 659, 784, 1046, 784, 1046, 1318, 1568].forEach((f, i) =>
      tone(f, f, 0.13, 'square', 0.06, i * 0.1),
    );
    [261, 329, 392].forEach((f, i) => tone(f, f, 0.4, 'triangle', 0.04, 0.8 + i * 0.02));
    [1568, 2093, 2637].forEach((f, i) => tone(f, f, 0.3, 'square', 0.035, 1.1 + i * 0.12));
  }, [tone]);

  const confetti = useMemo<Confetto[]>(() => {
    if (!jackpot || reduce) return [];
    return Array.from({ length: 64 }, (_, i) => ({
      left: (i * 97 + 13) % 100,
      delay: ((i * 37) % 800) / 1000,
      dur: 1.8 + ((i * 53) % 1100) / 1000,
      size: 5 + ((i * 29) % 6),
      color: CONFETTI[i % CONFETTI.length],
    }));
  }, [jackpot, reduce]);

  /* Monedas en cualquier WIN (común + raro + jackpot base) */
  const coins = useMemo<Confetto[]>(() => {
    if (winTier == null || reduce) return [];
    const count = winTier === 'jackpot' ? 26 : winTier === 'rare' ? 22 : 16;
    return Array.from({ length: count }, (_, i) => ({
      left: (i * 61 + 7) % 100,
      delay: ((i * 41) % 500) / 1000,
      dur: 1.1 + ((i * 47) % 600) / 1000,
      size: 9 + ((i * 17) % 5),
      color: i % 3 === 0 ? '#fff6d6' : '#ffd60a',
    }));
  }, [winTier, reduce]);

  const pulseLever = useCallback(() => {
    if (reduce) return;
    setLeverPulled(true);
    const t = window.setTimeout(() => setLeverPulled(false), 620);
    timeoutsRef.current.push(t);
  }, [reduce]);

  const triggerShake = useCallback(
    (kind: 'spin' | 'rare' | 'jackpot') => {
      if (reduce) return;
      setShake('idle');
      requestAnimationFrame(() => {
        setShake(kind);
        const ms = kind === 'spin' ? 550 : kind === 'rare' ? 900 : 1500;
        const t = window.setTimeout(() => setShake('idle'), ms);
        timeoutsRef.current.push(t);
      });
    },
    [reduce],
  );

  const finalize = useCallback(
    (final: SymbolId[], wager: number, n: number) => {
      const [a, b, c] = final;
      const won = a === b && b === c;
      const def = BY_ID[a];
      let win = 0;
      let isJackpot = false;
      let tier: WinTier | null = null;
      if (won) {
        tier = TIER_BY_SYMBOL[a];
        win = wager * def.pay;
        if (def.jackpot) {
          isJackpot = true;
          win += JACKPOT_BONUS;
        }
      }
      setCredits((prev) => prev + win);
      setLastWin(win);
      setJackpot(isJackpot);
      setWinTier(tier);
      if (tier) setWinKey((k) => k + 1);
      setHistory((prev) =>
        [{ n, faces: final, bet: wager, win, jackpot: isJackpot }, ...prev].slice(0, 4),
      );
      if (won && tier) {
        if (tier === 'jackpot') {
          sfxJackpot();
          triggerShake('jackpot');
          setResult(`JACKPOT MASTER BALL x3 · +${win} CREDITOS.`);
        } else if (tier === 'rare') {
          sfxRare();
          triggerShake('rare');
          setResult(`PREMIO RARO ${def.name.toUpperCase()} x3 · +${win} CREDITOS.`);
        } else {
          sfxWin();
          setResult(`PREMIO ${def.name.toUpperCase()} x3 · +${win} CREDITOS.`);
        }
      } else {
        setResult(`SIN PREMIO · ${final.map((f) => BY_ID[f].name.toUpperCase()).join(' / ')}.`);
      }
      setSpinning(false);
      setLocked([true, true, true]);
    },
    [sfxJackpot, sfxRare, sfxWin, triggerShake],
  );

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const spin = useCallback(() => {
    if (spinning) return;
    if (credits < bet) {
      setResult(`SIN CREDITOS · PULSA +${START_CREDITS} PARA RECARGAR.`);
      return;
    }
    ensureAudio();
    clearTimers();
    const n = spinCount + 1;
    setSpinCount(n);
    const final: SymbolId[] = rollFinal();
    const wager = bet;
    setCredits((prev) => prev - wager);
    setJackpot(false);
    setWinTier(null);
    setSpinning(true);
    setResult('GIRANDO... BUENA SUERTE, ENTRENADOR.');
    sfxClack();
    sfxSpin();
    pulseLever();
    triggerShake('spin');

    if (reduce) {
      setReels(final);
      setLocked([true, true, true]);
      const t = window.setTimeout(() => finalize(final, wager, n), 60);
      timeoutsRef.current.push(t);
      return;
    }

    setLocked([false, false, false]);
    intervalRef.current = setInterval(() => {
      setReels([randomFace(), randomFace(), randomFace()]);
    }, 90);

    const stopReel = (index: number) => {
      setReels((prev) => {
        const next = [...prev] as SymbolId[];
        next[index] = final[index];
        return next;
      });
      setLocked((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      sfxStop();
    };

    timeoutsRef.current = [
      window.setTimeout(() => stopReel(0), 650),
      window.setTimeout(() => stopReel(1), 1150),
      window.setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        stopReel(2);
        finalize(final, wager, n);
      }, 1650),
    ];
  }, [spinning, credits, bet, ensureAudio, clearTimers, spinCount, sfxClack, sfxSpin, sfxStop, reduce, finalize, pulseLever, triggerShake]);

  /* Drag manual de la palanca: arrastra >28px para girar */
  const onLeverDown = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    dragStartY.current = e.clientY;
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  }, []);
  const onLeverMove = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current || dragStartY.current == null) return;
    setDragY(Math.max(0, e.clientY - dragStartY.current));
  }, []);
  const onLeverUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const dy = dragStartY.current == null ? 0 : e.clientY - dragStartY.current;
      dragStartY.current = null;
      setDragY(0);
      if (dy > 28) spin();
    },
    [spin],
  );

  const cycleBet = useCallback(() => {
    sfxBet();
    setBet((prev) => {
      const i = BETS.indexOf(prev as (typeof BETS)[number]);
      return BETS[(i + 1 + BETS.length) % BETS.length];
    });
  }, [sfxBet]);

  const recharge = useCallback(() => {
    setCredits((prev) => prev + START_CREDITS);
    setResult(`RECARGA +${START_CREDITS} · A JUGAR.`);
  }, []);

  const broke = credits < Math.min(...BETS);
  const facesLabel = reels.map((r) => BY_ID[r].name).join(', ');
  const allEqual = reels[0] === reels[1] && reels[1] === reels[2] && lastWin > 0 && !spinning;
  const shakeClass =
    shake === 'spin' ? 'arc-shake-sm' : shake === 'rare' ? 'arc-shake-md' : shake === 'jackpot' ? 'arc-shake-lg' : '';

  return (
    <section
      id="pokemon-slots"
      aria-labelledby="pokemon-slots-title"
      ref={ref}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <style>{`
        .font-pixel { font-family: 'Press Start 2P','VT323','Courier New',ui-monospace,Menlo,monospace; }
        @keyframes arc-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes arc-chase { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.25; transform: scale(0.72); } }
        @keyframes arc-crt { 0%,100% { opacity: 0; } 8% { opacity: 0.05; } 9% { opacity: 0; } 46% { opacity: 0; } 47% { opacity: 0.07; } 48% { opacity: 0; } 82% { opacity: 0.04; } 83% { opacity: 0; } }
        @keyframes arc-bg-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes arc-strip { 0% { transform: translateY(-8px) scaleY(1.06); } 100% { transform: translateY(8px) scaleY(1.06); } }
        @keyframes arc-land { 0% { transform: translateY(-10px) scaleY(1.14); } 55% { transform: translateY(3px) scaleY(0.96); } 100% { transform: translateY(0) scaleY(1); } }
        @keyframes arc-fall { 0% { transform: translateY(-24px); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(560px); opacity: 0; } }
        @keyframes arc-coin-fall { 0% { transform: translateY(-18px); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(170px); opacity: 0; } }
        @keyframes arc-coin-spin { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(0.2); } }
        @keyframes arc-coin-pulse { 0%,100% { transform: scale(1); opacity: 0.55; } 50% { transform: scale(1.06); opacity: 0.95; } }
        @keyframes arc-flash { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes arc-flash-fast { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes arc-shake-sm { 0%,100% { transform: translate(0,0); } 25% { transform: translate(1px,-1px); } 50% { transform: translate(-1px,1px); } 75% { transform: translate(1px,1px); } }
        @keyframes arc-shake-md { 0%,100% { transform: translate(0,0) rotate(0deg); } 20% { transform: translate(-3px,2px) rotate(-0.6deg); } 40% { transform: translate(3px,-2px) rotate(0.6deg); } 60% { transform: translate(-2px,-2px) rotate(-0.4deg); } 80% { transform: translate(2px,2px) rotate(0.4deg); } }
        @keyframes arc-shake-lg { 0%,100% { transform: translate(0,0) rotate(0deg); } 15% { transform: translate(-5px,3px) rotate(-1deg); } 30% { transform: translate(5px,-3px) rotate(1deg); } 45% { transform: translate(-4px,-3px) rotate(-0.8deg); } 60% { transform: translate(4px,3px) rotate(0.8deg); } 75% { transform: translate(-3px,2px) rotate(-0.5deg); } 90% { transform: translate(3px,-2px) rotate(0.5deg); } }
        @keyframes arc-galaga-ship { 0% { transform: translateX(-50%) translateX(-22px); } 100% { transform: translateX(-50%) translateX(22px); } }
        @keyframes arc-galaga-inv { 0% { transform: translateX(-50%) translateX(10px); } 100% { transform: translateX(-50%) translateX(-10px); } }
        @keyframes arc-bullet { 0% { transform: translateY(10px); opacity: 0; } 18% { opacity: 1; } 100% { transform: translateY(-66px); opacity: 0; } }
        @keyframes arc-boom { 0%,68% { opacity: 0; transform: scale(0.4); } 74% { opacity: 1; transform: scale(1.15); } 88% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.6); } }
        @keyframes arc-star { 0% { transform: translateY(-6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(120px); opacity: 0; } }
        @keyframes arc-mario-run { 0% { transform: translateX(-8px); } 100% { transform: translateX(58px); } }
        @keyframes arc-mario-jump { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        @keyframes arc-frame-a { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes arc-frame-b { 0%,49% { opacity: 0; } 50%,100% { opacity: 1; } }
        @keyframes arc-goomba { 0% { transform: translateX(0); } 100% { transform: translateX(-42px); } }
        @keyframes arc-pac-run { 0% { transform: translateX(0); } 100% { transform: translateX(96px); } }
        @keyframes arc-ghost-a { 0% { transform: translateX(-16px); } 100% { transform: translateX(80px); } }
        @keyframes arc-ghost-b { 0% { transform: translateX(-30px); } 100% { transform: translateX(66px); } }
        @keyframes arc-pellet { 0%,100% { opacity: 1; } 50% { opacity: 0.15; } }
        @keyframes arc-power { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.7); } }
        @keyframes arc-tetris-fall { 0% { transform: translateY(-6px); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(52px); opacity: 1; } }
        @keyframes arc-tetris-fall-b { 0% { transform: translateY(-10px); opacity: 0; } 14% { opacity: 1; } 100% { transform: translateY(44px); opacity: 1; } }
        @keyframes arc-tetris-clear { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes arc-ray { 0%,100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        @keyframes arc-green-flash { 0%,100% { opacity: 0.25; } 50% { opacity: 0.75; } }
        .arc-blink { animation: arc-blink 1.4s steps(2, jump-none) infinite; }
        .arc-chase { animation: arc-chase 1s ease-in-out infinite; }
        .arc-crt { animation: arc-crt 5s linear infinite; }
        .arc-bg-spin { animation: arc-bg-spin 70s linear infinite; }
        .arc-strip { animation: arc-strip 90ms linear infinite alternate; }
        .arc-reel-land { animation: arc-land 0.34s cubic-bezier(0.34,1.56,0.64,1) 1; }
        .arc-fall { animation: arc-fall linear forwards; }
        .arc-coin-fall { animation: arc-coin-fall linear forwards; }
        .arc-coin-spin { animation: arc-coin-spin 0.9s ease-in-out infinite; }
        .arc-coin-pulse { animation: arc-coin-pulse 1.4s ease-in-out infinite; }
        .arc-flash { animation: arc-flash 0.9s steps(2, jump-none) infinite; }
        .arc-flash-fast { animation: arc-flash-fast 0.35s steps(2, jump-none) infinite; }
        .arc-shake-sm { animation: arc-shake-sm 0.45s linear 1; }
        .arc-shake-md { animation: arc-shake-md 0.85s linear 1; }
        .arc-shake-lg { animation: arc-shake-lg 0.7s linear 3; }
        .arc-galaga-ship { animation: arc-galaga-ship 2.6s ease-in-out infinite alternate; }
        .arc-galaga-inv { animation: arc-galaga-inv 3.2s ease-in-out infinite alternate; }
        .arc-bullet { animation: arc-bullet 1.1s linear infinite; }
        .arc-boom { animation: arc-boom 1.1s linear infinite; }
        .arc-star { animation: arc-star 3.2s linear infinite; }
        .arc-mario-run { animation: arc-mario-run 3.4s linear infinite alternate; }
        .arc-mario-jump { animation: arc-mario-jump 1.5s ease-in-out infinite; }
        .arc-frame-a { animation: arc-frame-a 0.5s steps(1, jump-none) infinite; }
        .arc-frame-b { animation: arc-frame-b 0.5s steps(1, jump-none) infinite; }
        .arc-goomba { animation: arc-goomba 4s linear infinite alternate; }
        .arc-pac-run { animation: arc-pac-run 3.2s linear infinite; }
        .arc-ghost-a { animation: arc-ghost-a 3.2s linear infinite; }
        .arc-ghost-b { animation: arc-ghost-b 3.8s linear infinite; }
        .arc-pellet { animation: arc-pellet 1.1s ease-in-out infinite; }
        .arc-power { animation: arc-power 0.9s ease-in-out infinite; }
        .arc-tetris-fall { animation: arc-tetris-fall 2.8s linear infinite; }
        .arc-tetris-fall-b { animation: arc-tetris-fall-b 2.8s linear infinite; }
        .arc-tetris-clear { animation: arc-tetris-clear 0.8s ease-in-out infinite; }
        .arc-ray { animation: arc-ray 0.7s ease-in-out infinite; }
        .arc-green-flash { animation: arc-green-flash 0.8s ease-in-out infinite; }
        .arc-scan { background: repeating-linear-gradient(0deg, rgba(0,0,0,.38) 0 1px, transparent 1px 3px); }
        .arc-rays { background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(250,204,21,.16) 0deg 7deg, transparent 7deg 15deg); }
        .arc-dots { background-image: radial-gradient(circle, rgba(255,255,255,.92) 2.6px, transparent 3.2px); background-size: 26px 26px; }
        .arc-reel-blur { filter: blur(2.5px) brightness(1.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          /* Vestibular / funcional / flashes: se congelan de verdad. */
          .arc-blink, .arc-strip, .arc-reel-land, .arc-fall, .arc-coin-fall,
          .arc-flash, .arc-flash-fast, .arc-shake-sm, .arc-shake-md, .arc-shake-lg,
          .arc-ray, .arc-green-flash { animation: none !important; }
          /* Attract modes decorativos (aria-hidden, solo transform/opacity):
             NO se congelan — se ralentizan con longhands + !important para
             sobrevivir al kill global de index.css (* duration 0.01ms +
             count 1 !important). Especificidad (.arc-* mayor que *) + orden ganan.
             Durations lentas y distintas por familia para prueba visual. */
          .arc-chase { animation-name: arc-chase !important; animation-duration: 2.4s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-crt { animation-name: arc-crt !important; animation-duration: 9s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-bg-spin { animation-name: arc-bg-spin !important; animation-duration: 120s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-coin-spin { animation-name: arc-coin-spin !important; animation-duration: 1.8s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-coin-pulse { animation-name: arc-coin-pulse !important; animation-duration: 2.8s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-galaga-ship { animation-name: arc-galaga-ship !important; animation-duration: 5.2s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; animation-direction: alternate !important; }
          .arc-galaga-inv { animation-name: arc-galaga-inv !important; animation-duration: 6.4s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; animation-direction: alternate !important; }
          .arc-bullet { animation-name: arc-bullet !important; animation-duration: 2.2s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-boom { animation-name: arc-boom !important; animation-duration: 2.6s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-star { animation-name: arc-star !important; animation-duration: 6s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-mario-run { animation-name: arc-mario-run !important; animation-duration: 6.8s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; animation-direction: alternate !important; }
          .arc-mario-jump { animation-name: arc-mario-jump !important; animation-duration: 3s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-frame-a { animation-name: arc-frame-a !important; animation-duration: 1s !important; animation-timing-function: steps(1, jump-none) !important; animation-iteration-count: infinite !important; }
          .arc-frame-b { animation-name: arc-frame-b !important; animation-duration: 1s !important; animation-timing-function: steps(1, jump-none) !important; animation-iteration-count: infinite !important; }
          .arc-goomba { animation-name: arc-goomba !important; animation-duration: 8s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; animation-direction: alternate !important; }
          .arc-pac-run { animation-name: arc-pac-run !important; animation-duration: 6.4s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-ghost-a { animation-name: arc-ghost-a !important; animation-duration: 6.4s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-ghost-b { animation-name: arc-ghost-b !important; animation-duration: 7.6s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-pellet { animation-name: arc-pellet !important; animation-duration: 2.2s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-power { animation-name: arc-power !important; animation-duration: 1.8s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
          .arc-tetris-fall { animation-name: arc-tetris-fall !important; animation-duration: 5.6s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-tetris-fall-b { animation-name: arc-tetris-fall-b !important; animation-duration: 6.2s !important; animation-timing-function: linear !important; animation-iteration-count: infinite !important; }
          .arc-tetris-clear { animation-name: arc-tetris-clear !important; animation-duration: 1.6s !important; animation-timing-function: ease-in-out !important; animation-iteration-count: infinite !important; }
        }
      `}</style>

      {/* fondo: rayos amarillos rotando lento + viñeta */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[60%] arc-bg-spin">
          <div className="arc-rays absolute inset-0" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 38%, transparent 30%, #050505 78%)' }}
        />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-4">
            <div className="h-[1px] w-8 bg-primary" aria-hidden="true" />
            <span className="font-mono text-sm uppercase tracking-widest text-primary">Bonus · Arcade 8-bit</span>
            <div className="h-[1px] w-8 bg-primary" aria-hidden="true" />
          </div>
          <h2 id="pokemon-slots-title" className="text-4xl font-bold md:text-6xl font-display">
            Poké Slots <span className="text-gradient">Arcade</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-light text-white/70">
            Cabinet arcade jugable: 3 iguales ganan y 3 Master Ball activan el jackpot con luces y chiptune.
          </p>
        </motion.div>

        {/* Carrusel móvil: 4 juegos diferentes, legibles arriba */}
        <div className="mb-8 lg:hidden">
          <p className="font-pixel mb-3 text-center text-[10px] tracking-[0.3em] text-[#FFE45E]" style={{ textShadow: '1px 1px 0 #000' }}>
            ★ SALÓN ARCADE ★
          </p>
          <div aria-hidden="true" className="no-scrollbar mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
            <MiniCabinet variant="galaga" reduce={reduce} />
            <MiniCabinet variant="pacman" reduce={reduce} />
            <MiniCabinet variant="mario" reduce={reduce} slow />
            <MiniCabinet variant="tetris" reduce={reduce} slow />
          </div>
          <p className="mt-1 text-center font-mono text-[11px] text-white/50">Desliza → Galaga · Pac-Man · Mario · Tetris en vivo</p>
        </div>

        {/* Grid 3 columnas: izq — cabinet — der (sin solape) */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto grid max-w-6xl items-center justify-center gap-10 lg:grid-cols-[200px_minmax(0,470px)_200px]"
        >
          <SideColumn side="left" reduce={reduce} />

          <div className="mx-auto w-full max-w-[470px]">
          {/* ============ CABINET ============ */}
          <div className={`overflow-hidden rounded-[18px] border-4 border-black bg-[#141419] shadow-[0_30px_90px_rgba(0,0,0,.65)] ${shakeClass}`}>
            {/* MARQUEE con chase */}
            <div
              className="relative border-b-4 border-black px-4 pb-3.5 pt-3.5"
              style={{ background: 'linear-gradient(180deg,#e5383b 0%,#c1121f 55%,#8f0d18 100%)' }}
            >
              <div aria-hidden="true" className="mb-2.5 flex items-center justify-center gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full ${i % 2 === 0 ? 'bg-[#ffd60a]' : 'bg-white'} ${jackpot && !reduce ? 'arc-flash-fast' : 'arc-chase'}`}
                    style={{
                      animationDelay: `${(i % 6) * (jackpot ? 0.07 : 0.12)}s`,
                      boxShadow: i % 2 === 0 ? '0 0 10px #ffd60a' : '0 0 10px #fff',
                    }}
                  />
                ))}
              </div>
              <p
                className="font-pixel text-center text-sm tracking-[0.3em] text-[#FFE45E]"
                style={{ textShadow: '2px 2px 0 #5c0a0a, 0 0 14px rgba(255,214,10,.65)' }}
              >
                ★ ARCADE ★
              </p>
              <p
                className="font-pixel mt-2 text-center text-2xl leading-none text-white md:text-[28px]"
                style={{ textShadow: '3px 3px 0 #5c0a0a, -1px -1px 0 #5c0a0a, 0 0 18px rgba(255,255,255,.35)' }}
              >
                POKE-SLOTS
              </p>
            </div>

            {/* CUELLO */}
            <p
              className="font-pixel border-b border-white/10 bg-black px-4 py-2 text-center text-xs tracking-[0.3em] text-[#5EEAD4]"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              3 REELS · RNG LOCAL · SIN DINERO REAL
            </p>

            {/* CRT */}
            <div className="bg-[#0b0b10] p-3">
              <div
                className={`relative overflow-hidden rounded-[18px] border-4 border-black ${
                  jackpot ? 'shadow-[0_0_44px_rgba(255,214,10,.55)]' : 'shadow-[0_0_28px_rgba(56,189,248,.25)]'
                }`}
                style={{ background: 'linear-gradient(180deg,#0d3566 0%,#061c3d 55%,#04263b 100%)' }}
              >
                {/* brillo + scanlines + flicker */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{ background: 'radial-gradient(ellipse 90% 60% at 20% 0%, rgba(255,255,255,.16), transparent 55%)' }}
                />
                <div aria-hidden="true" className="arc-scan pointer-events-none absolute inset-0 z-20 opacity-80" />
                {!reduce && <div aria-hidden="true" className="arc-crt pointer-events-none absolute inset-0 z-20 bg-white" />}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{ boxShadow: 'inset 0 0 46px rgba(0,0,0,.75), inset 0 0 12px rgba(0,0,0,.9)' }}
                />
                {/* FX común: destello verde */}
                {winTier === 'common' && !spinning && (
                  <div
                    key={`green-${winKey}`}
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 z-20 border-4 border-[#39ff14] ${reduce ? '' : 'arc-green-flash'}`}
                    style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(57,255,20,.35), transparent 70%)', borderRadius: 14 }}
                  />
                )}
                {/* FX raro: rayos */}
                {winTier === 'rare' && !spinning && (
                  <div key={`rays-${winKey}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
                    <div className={`absolute inset-0 ${reduce ? '' : 'arc-ray'}`} style={{ background: 'repeating-conic-gradient(from 0deg at 50% 45%, rgba(56,189,248,.28) 0deg 8deg, transparent 8deg 18deg)' }} />
                    <span className={`absolute left-2 top-8 ${reduce ? '' : 'arc-ray'}`}>
                      <PixelSprite map={BOLT_MAP} label="" className="h-10 w-6" />
                    </span>
                    <span className={`absolute right-2 top-6 ${reduce ? '' : 'arc-ray'}`} style={reduce ? undefined : { animationDelay: '0.35s' }}>
                      <PixelSprite map={BOLT_MAP} label="" className="h-12 w-7" />
                    </span>
                  </div>
                )}

                <div className="relative z-10 p-3.5">
                  {/* HUD */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'CRED', v: String(credits) },
                      { l: 'BET', v: String(bet) },
                      { l: 'WIN', v: `+${lastWin}` },
                    ].map((m) => (
                      <div key={m.l} className="rounded-[10px] border border-[#c6ff5e]/25 bg-black/70 px-1 py-2 text-center">
                        <p className="font-pixel text-[9px] tracking-[0.25em] text-[#C6FF5E]/90">{m.l}</p>
                        <p
                          className="font-pixel mt-1.5 text-sm tabular-nums text-[#E9FFB8] md:text-base"
                          style={{ textShadow: '0 0 12px rgba(198,255,94,.55)' }}
                        >
                          {m.v}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CARRETES con blur + rebote de parada */}
                  <div role="img" aria-label={`Carretes: ${facesLabel}`} className="mt-2.5 grid grid-cols-3 gap-2">
                    {reels.map((face, i) => {
                      const moving = spinning && !locked[i];
                      const justLanded = !moving && !spinning && locked[i];
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] border-[3px] bg-[#cde79a] px-1 py-2.5"
                          style={{
                            borderColor: allEqual ? '#ffd60a' : locked[i] ? '#0b0b10' : '#ff7b00',
                            boxShadow: allEqual
                              ? '0 0 18px rgba(255,214,10,.8), inset 0 0 10px rgba(0,0,0,.25)'
                              : 'inset 0 0 10px rgba(0,0,0,.25)',
                          }}
                        >
                          <div
                            key={`${spinCount}-${i}-${locked[i]}`}
                            className={`${moving && !reduce ? 'arc-strip arc-reel-blur' : ''} ${justLanded && !reduce && winKey >= 0 && spinCount > 0 ? 'arc-reel-land' : ''}`}
                          >
                            <SymbolPixel id={face} className="h-16 w-16 md:h-[72px] md:w-[72px]" />
                          </div>
                          <span className="font-pixel text-[8px] uppercase tracking-[0.18em] text-[#16240F]">
                            {moving ? '···' : BY_ID[face].name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* MENSAJE */}
                  <div
                    aria-live="polite"
                    aria-atomic="true"
                    className={`font-pixel mt-2.5 rounded-[10px] border px-3 py-2.5 text-center text-[11px] leading-relaxed tracking-wide md:text-xs ${
                      jackpot
                        ? `border-[#ffd60a] bg-black/80 text-[#FFE45E] ${reduce ? '' : 'arc-flash-fast'}`
                        : winTier === 'rare' && !spinning
                          ? `border-[#38bdf8]/60 bg-black/80 text-[#BAE6FD] ${reduce ? '' : 'arc-flash'}`
                          : winTier === 'common' && !spinning
                            ? 'border-[#39ff14]/60 bg-black/80 text-[#86FF6B]'
                            : lastWin > 0 && !spinning
                              ? 'border-[#c6ff5e]/50 bg-black/70 text-[#E9FFB8]'
                              : 'border-white/15 bg-black/70 text-[#FFF6D6]'
                    }`}
                    style={{ textShadow: '1px 1px 0 #000' }}
                  >
                    {spinning ? `GIRANDO... ${locked.filter(Boolean).length}/3 FIJOS` : result}
                  </div>

                  {/* Banners por tier */}
                  {winTier === 'common' && !spinning && (
                    <div key={`b-common-${winKey}`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center">
                      <p className="font-pixel inline-block rounded-[10px] border-2 border-[#39ff14] bg-black/90 px-4 py-2 text-xs tracking-wider text-[#86FF6B]" style={{ textShadow: '1px 1px 0 #052e05' }}>
                        ✦ PREMIO +{lastWin} ✦
                      </p>
                    </div>
                  )}
                  {winTier === 'rare' && !spinning && (
                    <div key={`b-rare-${winKey}`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center">
                      <p className={`font-pixel inline-block rounded-[10px] border-2 border-[#38bdf8] bg-black/90 px-4 py-2 text-[13px] tracking-wider text-[#BAE6FD] ${reduce ? '' : 'arc-flash'}`} style={{ textShadow: '2px 2px 0 #0c2a44' }}>
                        ⚡ RARO +{lastWin} ⚡
                      </p>
                    </div>
                  )}
                  {jackpot && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center">
                      <p
                        className={`font-pixel inline-block rounded-[10px] border-2 border-[#ffd60a] bg-black/90 px-4 py-2 text-base tracking-wider text-[#FFE45E] ${reduce ? '' : 'arc-flash-fast'}`}
                        style={{ textShadow: '2px 2px 0 #5c0a0a', boxShadow: '0 0 30px rgba(255,214,10,.6)' }}
                      >
                        ★ JACKPOT +{lastWin} ★
                      </p>
                    </div>
                  )}
                </div>

                {/* monedas pixel en cualquier WIN */}
                {winTier != null && !spinning && (
                  <div key={`coins-${winKey}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                    {!reduce &&
                      coins.map((c, i) => (
                        <span
                          key={i}
                          className="arc-coin-fall absolute top-0"
                          style={{
                            left: `${c.left}%`,
                            width: `${c.size}px`,
                            height: `${c.size}px`,
                            animationDuration: `${c.dur}s`,
                            animationDelay: `${c.delay}s`,
                          }}
                        >
                          <PixelSprite map={COIN_MAP} label="" className="h-full w-full" />
                        </span>
                      ))}
                  </div>
                )}
                {/* confetti pixel (jackpot) */}
                {jackpot && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
                    {!reduce &&
                      confetti.map((c, i) => (
                        <span
                          key={i}
                          className="arc-fall absolute top-0"
                          style={{
                            left: `${c.left}%`,
                            width: `${c.size}px`,
                            height: `${c.size}px`,
                            background: c.color,
                            animationDuration: `${c.dur}s`,
                            animationDelay: `${c.delay}s`,
                          }}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DE CONTROL: solo BET + SPIN + palanca */}
            <div
              className="border-t-4 border-black px-4 pb-4 pt-5"
              style={{ background: 'linear-gradient(180deg,#33333e,#1b1b22)' }}
            >
              <div className="grid grid-cols-3 items-center justify-items-center gap-2">
                <div className="flex flex-col items-center gap-2 pt-6">
                  <button
                    type="button"
                    onClick={cycleBet}
                    disabled={spinning}
                    aria-label={`Cambiar apuesta, actual ${bet}`}
                    className="h-14 w-14 rounded-full border-[3px] border-black font-pixel text-[10px] tracking-wider text-black transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffcc] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #fff8d6, #ffd60a 55%, #9a7b00 140%)',
                      boxShadow: '0 4px 0 #0b0b10, 0 0 14px rgba(255,214,10,.5)',
                    }}
                  >
                    BET
                  </button>
                  <span className="font-pixel text-[9px] tracking-[0.2em] text-[#FFF6D6]" style={{ textShadow: '1px 1px 0 #000' }}>
                    BET {bet}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 pt-6">
                  <button
                    type="button"
                    onClick={spin}
                    disabled={spinning || broke}
                    aria-label={spinning ? 'Girando carretes' : `Girar, apuesta ${bet} créditos`}
                    className="h-16 w-16 rounded-full border-[3px] border-black font-pixel text-[10px] tracking-wider text-white transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffcc] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #ffb3ab, #e5383b 55%, #6e0a10 140%)',
                      boxShadow: '0 4px 0 #0b0b10, 0 0 18px rgba(229,56,59,.65)',
                    }}
                  >
                    {spinning ? '···' : 'SPIN'}
                  </button>
                  <span className="font-pixel text-[9px] tracking-[0.2em] text-[#FFF6D6]" style={{ textShadow: '1px 1px 0 #000' }}>
                    PULSA
                  </span>
                </div>
                <div className="block">
                  <Lever
                    onPull={spin}
                    disabled={spinning || broke}
                    spinning={spinning}
                    reduce={reduce}
                    pulled={leverPulled}
                    dragY={dragY}
                    onPointerDown={onLeverDown}
                    onPointerMove={onLeverMove}
                    onPointerUp={onLeverUp}
                  />
                </div>
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-white/60">
                Arrastra la palanca ↓ · o pulsa ↓ / SPIN
              </p>
            </div>

            {/* BASE ROJA CON LUNARES + botón +1000 pulsante */}
            <div className="relative border-t-4 border-black" style={{ background: '#c1121f' }}>
              <div aria-hidden="true" className="arc-dots absolute inset-0 opacity-25" />
              <div className="relative flex flex-col items-center justify-center gap-2.5 px-4 py-4">
                <div className="relative">
                  <span aria-hidden="true" className="arc-coin-pulse absolute -inset-1.5 rounded-2xl bg-[#ffd60a]/50 blur-[6px]" />
                  <button
                    type="button"
                    onClick={recharge}
                    aria-label={`Recargar ${START_CREDITS} créditos`}
                    className="relative min-h-[56px] rounded-[14px] border-[3px] border-black px-7 font-pixel text-[13px] tracking-[0.15em] text-[#2b0a0a] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white hover:scale-[1.03] active:scale-95 arc-coin-pulse"
                    style={{
                      background: 'linear-gradient(180deg,#ffe45e 0%,#ffd60a 45%,#ff7b00 100%)',
                      boxShadow: '0 4px 0 #0b0b10, 0 0 22px rgba(255,214,10,.75), inset 0 2px 0 rgba(255,255,255,.7)',
                      textShadow: '1px 1px 0 rgba(255,255,255,.6)',
                      animationDuration: '1.6s',
                    }}
                  >
                    🪙 +{START_CREDITS} COIN
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-pressed={muted}
                  aria-label={muted ? 'Activar sonido chiptune' : 'Silenciar sonido chiptune'}
                  className="min-h-[44px] min-w-[44px] rounded-[10px] border border-white/30 bg-black/85 px-3 font-mono text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffcc]"
                >
                  {muted ? '🔇' : '🔊'}
                </button>
              </div>
            </div>
          </div>
          {/* sombra suelo */}
          <div aria-hidden="true" className="mx-auto mt-3 h-4 w-3/4 rounded-[50%] bg-black/70 blur-md" />

          {broke && (
            <p role="alert" className="mt-3 text-center font-mono text-xs text-primary">
              Sin créditos — pulsa +{START_CREDITS} COIN para seguir jugando.
            </p>
          )}
          </div>

          <SideColumn side="right" reduce={reduce} />
        </motion.div>

        {/* Tabla de pagos + historial (estilo portfolio, fuera del cabinet) */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-3">
          <h3 className="text-center font-mono text-xs uppercase tracking-widest text-white/60">
            Tabla de pagos · 3 iguales · FX por símbolo
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {SYMBOLS.map((s) => {
              const tier = TIER_BY_SYMBOL[s.id];
              const meta = TIER_META[tier];
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                    s.jackpot ? 'border-[#ffd60a]/50 bg-[#ffd60a]/[0.07]' : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <span className="flex -space-x-1" aria-hidden="true">
                    <SymbolPixel id={s.id} className="h-7 w-7" />
                    <SymbolPixel id={s.id} className="h-7 w-7" />
                    <SymbolPixel id={s.id} className="h-7 w-7" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-xs font-medium text-white/90">{s.name}</span>
                    <span className={`block font-mono text-xs font-bold ${s.jackpot ? 'text-[#ffd60a]' : 'text-accent'}`}>
                      ×{s.pay}
                      {s.jackpot && JACKPOT_BONUS > 0 ? ` +${JACKPOT_BONUS}` : ''}
                    </span>
                    <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </span>
                </li>
              );
            })}
            <li className="flex items-center gap-2.5 rounded-xl border border-dashed border-white/15 px-3 py-2.5">
              <span aria-hidden="true" className="font-mono text-sm text-white/50">
                ✕ ✕ ✕
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-medium text-white/70">Otra combinación</span>
                <span className="block font-mono text-xs text-white/50">sin premio</span>
              </span>
            </li>
          </ul>
          <p className="text-center font-mono text-[11px] text-white/45">
            Común (Bulbasaur/Squirtle/Charmander) → {TIER_META.common.fx} · Raro (Pikachu/Poké Ball/Invader) →{' '}
            {TIER_META.rare.fx} · Master Ball → {TIER_META.jackpot.fx}
          </p>

          <h3 className="mt-4 text-center font-mono text-xs uppercase tracking-widest text-white/60">
            Historial · último premio {lastWin > 0 ? `+${lastWin}` : '—'}
          </h3>
          {history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-5 text-center font-mono text-xs text-white/50">
              Sin jugadas todavía — pulsa SPIN o tira de la palanca.
            </p>
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2">
              {history.map((h) => (
                <li
                  key={h.n}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 font-mono text-xs ${
                    h.jackpot
                      ? 'border-[#ffd60a]/50 bg-[#ffd60a]/[0.07] text-[#fde68a]'
                      : h.win > 0
                        ? 'border-accent/40 bg-accent/[0.06] text-white/90'
                        : 'border-white/10 bg-white/[0.02] text-white/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="flex -space-x-1">
                      {h.faces.map((f, i) => (
                        <span key={i} className="inline-block">
                          <SymbolPixel id={f} className="h-5 w-5" />
                        </span>
                      ))}
                    </span>
                    <span>
                      #{h.n} · ap. {h.bet}
                    </span>
                  </span>
                  <span className="font-bold tabular-nums">
                    {h.win > 0 ? `+${h.win}` : '+0'}
                    {h.jackpot ? ' ★' : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-2 text-center font-mono text-[11px] text-white/40">
            Juego decorativo sin dinero real · RNG en tu navegador · balance en localStorage.
          </p>
        </div>
      </div>
    </section>
  );
}
