"use client";

import React, { useRef, useId } from "react";
import Image from "next/image";
import { motion, useMotionValue, animate } from "framer-motion";
import { Camera, TrendingUp, TrendingDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmartGoalCardProps {
  goalName: string;
  savedAmount: number;
  targetAmount: number;
  imageUrl?: string | null;
  /** 0–100: how much of the goal has been saved */
  completion: number;
  /**
   * 0–100+: gap as % of target (shows red arc going CCW from the right end).
   * Represents the deficit → e.g. gap ₹58,833 / target ₹1,50,000 = 39%
   */
  negativePct?: number;
  monthlyTarget?: number;
  onTrack?: number;
  gap?: number;
  onImageChange?: (dataUri: string) => void;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

/** polar → cartesian.  0° = 12 o'clock, clockwise positive */
function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcLen(r: number, spanDeg: number) {
  return (spanDeg / 360) * 2 * Math.PI * r;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/** clockwise arc from startDeg, for fraction of spanDeg */
function buildCW(cx: number, cy: number, r: number, startDeg: number, spanDeg: number, frac: number) {
  const f   = clamp(frac, 0.001, 0.9999);
  const end = startDeg + spanDeg * f;
  const s   = polarToXY(cx, cy, r, startDeg);
  const e   = polarToXY(cx, cy, r, end);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${spanDeg * f > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

/** counter-clockwise arc from startDeg, going backward for fraction of spanDeg */
function buildCCW(cx: number, cy: number, r: number, startDeg: number, spanDeg: number, frac: number) {
  const f   = clamp(frac, 0.001, 0.9999);
  const end = startDeg - spanDeg * f;
  const s   = polarToXY(cx, cy, r, startDeg);
  const e   = polarToXY(cx, cy, r, end);
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${spanDeg * f > 180 ? 1 : 0} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── Arc layout ───────────────────────────────────────────────────────────────
// ARC_START = 210° (7 o'clock, bottom-left)  — where savings begin
// ARC_END   = 480° = 120° (4 o'clock, bottom-right) — where deficit erodes from
// ARC_SPAN  = 270°  (¾ circle, horseshoe)
// Green: CW  from ARC_START  (savings fill the arc left→top→right)
// Red:   CCW from ARC_END    (gap/deficit erodes the arc right→top→left)

const ARC_START = 210;
const ARC_SPAN  = 270;
const ARC_END   = ARC_START + ARC_SPAN; // 480° = same as 120°
const STROKE    = 15;

// ─── ArcSVG ───────────────────────────────────────────────────────────────────

interface ArcSVGProps {
  posPct: number;    // 0–100, positive goal completion (green CW)
  negPct: number;    // 0–100+, gap as % of target (red CCW)
  size: number;
  ids: { track: string; gradPos: string; gradNeg: string; glow: string; glowRed: string };
}

function ArcSVG({ posPct, negPct, size, ids }: ArcSVGProps) {
  const cx  = size / 2;
  const cy  = size / 2;
  const r   = cx - STROKE / 2 - 6;
  const len = arcLen(r, ARC_SPAN);

  const posFrac = clamp(posPct / 100, 0, 1);
  const negFrac = clamp(negPct / 100, 0, 1);

  // Animated dash offsets — start fully hidden, animate into view
  const posOff = useMotionValue(len);
  const negOff = useMotionValue(len);

  React.useEffect(() => {
    const c1 = animate(posOff, len * (1 - posFrac), { duration: 2.0, ease: [0.16, 1, 0.3, 1] });
    const c2 = animate(negOff, len * (1 - negFrac), { duration: 2.0, ease: [0.16, 1, 0.3, 1], delay: 0.08 });
    return () => { c1.stop(); c2.stop(); };
  }, [posFrac, negFrac, len, posOff, negOff]);

  // Full paths for both arcs (dashoffset controls how much shows)
  const trackPath = buildCW(cx, cy, r, ARC_START, ARC_SPAN, 1);
  const posPath   = buildCW(cx, cy, r, ARC_START, ARC_SPAN, 1);   // CW green
  const negPath   = buildCCW(cx, cy, r, ARC_END, ARC_SPAN, 1);   // CCW red

  // Glow dot positions (at the tip of each fill)
  const posDot = polarToXY(cx, cy, r, ARC_START + ARC_SPAN * posFrac);
  const negDot = polarToXY(cx, cy, r, ARC_END   - ARC_SPAN * negFrac);

  const showPos = posPct > 1;
  const showNeg = negPct > 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        {/* Track (dark navy) */}
        <linearGradient id={ids.track} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#181D2E" />
          <stop offset="100%" stopColor="#1E2438" />
        </linearGradient>

        {/* Positive — emerald green */}
        <linearGradient id={ids.gradPos} x1={cx} y1={size} x2={cx} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#004D2E" />
          <stop offset="40%"  stopColor="#00965A" />
          <stop offset="80%"  stopColor="#00C87A" />
          <stop offset="100%" stopColor="#3DFFC0" />
        </linearGradient>

        {/* Negative — crimson red */}
        <linearGradient id={ids.gradNeg} x1={cx} y1={0} x2={cx} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#6B0000" />
          <stop offset="35%"  stopColor="#BB1100" />
          <stop offset="70%"  stopColor="#FF2E0F" />
          <stop offset="100%" stopColor="#FF6040" />
        </linearGradient>

        {/* Green glow */}
        <filter id={ids.glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Red glow (slightly warmer) */}
        <filter id={ids.glowRed} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Track ring (always visible) ── */}
      <path
        d={trackPath}
        fill="none"
        stroke={`url(#${ids.track})`}
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity={0.75}
      />

      {/* ── Positive arc: CW from start (green) ── */}
      {posFrac > 0.001 && (
        <motion.path
          d={posPath}
          fill="none"
          stroke={`url(#${ids.gradPos})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={len}
          style={{ strokeDashoffset: posOff }}
          filter={`url(#${ids.glow})`}
        />
      )}

      {/* ── Negative arc: CCW from end (red) ── */}
      {negFrac > 0.001 && (
        <motion.path
          d={negPath}
          fill="none"
          stroke={`url(#${ids.gradNeg})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={len}
          style={{ strokeDashoffset: negOff }}
          filter={`url(#${ids.glowRed})`}
        />
      )}

      {/* ── Origin tick at ARC_START (always visible anchor dot) ── */}
      {(() => {
        const origin = polarToXY(cx, cy, r, ARC_START);
        return (
          <circle
            cx={origin.x}
            cy={origin.y}
            r={STROKE / 2 - 1}
            fill={showPos ? "#00C87A" : showNeg ? "#FF2E0F" : "#2E3555"}
            opacity={0.9}
          />
        );
      })()}

      {/* ── Green glow dot at positive tip ── */}
      {showPos && (
        <>
          <motion.circle cx={posDot.x} cy={posDot.y} r={STROKE / 2 + 3}
            fill="#00C87A" filter={`url(#${ids.glow})`}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.4, ease: "backOut" }}
          />
          <motion.circle cx={posDot.x} cy={posDot.y} r={STROKE / 2 - 3}
            fill="#ffffff"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.95 }}
            transition={{ delay: 1.9, duration: 0.3, ease: "backOut" }}
          />
        </>
      )}

      {/* ── Red glow dot at negative tip ── */}
      {showNeg && (
        <>
          <motion.circle cx={negDot.x} cy={negDot.y} r={STROKE / 2 + 3}
            fill="#FF2E0F" filter={`url(#${ids.glowRed})`}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.4, ease: "backOut" }}
          />
          <motion.circle cx={negDot.x} cy={negDot.y} r={STROKE / 2 - 3}
            fill="#ffffff"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.95 }}
            transition={{ delay: 1.9, duration: 0.3, ease: "backOut" }}
          />
        </>
      )}
    </svg>
  );
}

// ─── Stat item ────────────────────────────────────────────────────────────────

function Stat({ label, value, color = "white" }: { label: string; value: string; color?: "white" | "red" | "green" }) {
  const colorMap = { white: "text-white", red: "text-[#FF4B2B]", green: "text-[#00C87A]" };
  return (
    <div>
      <p className="text-[9px] md:text-[10px] uppercase tracking-[0.17em] font-extrabold text-[#474A5B] mb-1">
        {label}
      </p>
      <p className={`text-sm md:text-lg font-bold leading-none ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

// ─── SmartGoalCard ────────────────────────────────────────────────────────────

export default function SmartGoalCard({
  goalName,
  savedAmount,
  targetAmount,
  imageUrl,
  completion,
  negativePct = 0,
  monthlyTarget,
  onTrack,
  gap,
  onImageChange,
}: SmartGoalCardProps) {
  const uid     = useId();
  const ids     = {
    track:   `sg-track-${uid}`,
    gradPos: `sg-gpos-${uid}`,
    gradNeg: `sg-gneg-${uid}`,
    glow:    `sg-glow-${uid}`,
    glowRed: `sg-glowr-${uid}`,
  };
  const fileRef = useRef<HTMLInputElement>(null);

  const posPct  = Math.min(Math.max(Math.round(completion), 0), 100);
  const negPct  = Math.min(Math.max(Math.round(negativePct), 0), 100);

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

  const isNegativeScenario = negPct > 0 && posPct === 0;
  const badgeColor = isNegativeScenario ? "#FF2E0F" : posPct > 0 ? "#00C87A" : "#FFB800";
  const badgeLabel = isNegativeScenario ? "Deficit" : "Done";
  const badgeValue = isNegativeScenario ? `-${negPct}%` : `+${posPct}%`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageChange) return;
    const reader = new FileReader();
    reader.onload = (ev) => onImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <section
      className="relative w-full rounded-3xl overflow-hidden border border-white/[0.05] shadow-2xl"
      style={{ background: "linear-gradient(155deg, #0C0F1A 0%, #090B14 100%)" }}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* ── HERO: Arc + Image ── */}
      <div className="relative flex justify-center items-center pt-6 pb-2">
        <div className="relative" style={{ width: "min(100%, 500px)", aspectRatio: "1 / 1" }}>

          {/* Arc layer */}
          <ArcSVG posPct={posPct} negPct={negPct} size={500} ids={ids} />

          {/* Image frame — inset inside arc */}
          <div
            className="absolute overflow-hidden shadow-2xl"
            style={{
              top: "10%", left: "10%", right: "10%", bottom: "10%",
              borderRadius: "50%",
              boxShadow: "0 0 80px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={goalName}
                fill
                sizes="(max-width: 640px) 80vw, 400px"
                className="object-cover object-center"
                unoptimized={imageUrl.startsWith("data:")}
              />
            ) : (
              <div className="w-full h-full bg-[#0F1220] flex flex-col items-center justify-center gap-3">
                <Camera className="w-10 h-10 text-[#252B44]" />
                <p className="text-[#252B44] text-sm font-medium">Add Goal Photo</p>
              </div>
            )}

            {/* Bottom darken */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(4,6,16,0.92) 0%, rgba(4,6,16,0.45) 38%, transparent 70%)" }}
            />

            {/* Goal name + amount */}
            <div className="absolute bottom-[12%] left-[8%] right-[8%] z-10 text-center">
              <p className="text-[#FFB800] text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 drop-shadow">
                Goal: {goalName}
              </p>
              <div className="flex items-baseline justify-center gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none drop-shadow-xl">
                  {fmt(savedAmount)}
                </span>
                <span className="text-xs text-white/40 font-medium">/ {fmt(targetAmount)}</span>
              </div>
            </div>

            {/* Update Photo */}
            {onImageChange && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute top-[18%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-black/80 transition-colors whitespace-nowrap"
              >
                <Camera className="w-3 h-3 flex-shrink-0" />
                Update Photo
              </button>
            )}
          </div>

          {/* ── Badge: upper-right corner, inside the arc gap ── */}
          <motion.div
            className="absolute z-20 flex flex-col items-center"
            style={{ top: "6%", right: "3%" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.5, ease: "backOut" }}
          >
            <span
              className="text-2xl md:text-3xl font-black leading-none tracking-tight drop-shadow-lg"
              style={{ color: badgeColor }}
            >
              {badgeValue}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[#474A5B] font-bold mt-0.5">
              {badgeLabel}
            </span>
          </motion.div>

          {/* ── Legend: lower-left (green = savings) and lower-right (red = deficit) ── */}
          <div className="absolute bottom-[4%] left-[11%] z-20 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#00C87A]" />
            <span className="text-[9px] text-[#474A5B] font-bold uppercase tracking-wide">Saved</span>
          </div>
          <div className="absolute bottom-[4%] right-[11%] z-20 flex items-center gap-1">
            <span className="text-[9px] text-[#474A5B] font-bold uppercase tracking-wide">Gap</span>
            <div className="w-2 h-2 rounded-full bg-[#FF2E0F]" />
          </div>
        </div>
      </div>

      {/* ── Bi-directional bar ── */}
      <div className="mx-6 md:mx-8 mt-2 mb-1">
        {/* Label row */}
        <div className="flex justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#00C87A]" />
            <span className="text-[9px] text-[#00C87A] font-bold uppercase tracking-wider">+{posPct}% saved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#FF4B2B] font-bold uppercase tracking-wider">-{negPct}% gap</span>
            <TrendingDown className="w-3 h-3 text-[#FF4B2B]" />
          </div>
        </div>

        {/* Bar track */}
        <div className="relative h-[5px] rounded-full bg-[#181C2E] overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-white/10 z-10" />

          {/* Green: extends right from center */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              left: "50%",
              background: "linear-gradient(90deg, #00965A, #00C87A, #3DFFC0)",
              transformOrigin: "left",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${clamp(posPct / 100, 0, 1) * 50}%` }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Red: extends left from center */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              right: "50%",
              background: "linear-gradient(270deg, #BB1100, #FF2E0F, #FF6040)",
              transformOrigin: "right",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${clamp(negPct / 100, 0, 1) * 50}%` }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          />
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="flex items-start justify-between px-6 md:px-8 pt-4 pb-5 mt-2 border-t border-white/[0.04]">
        {monthlyTarget !== undefined && (
          <Stat label="Target" value={`₹${monthlyTarget.toLocaleString("en-IN")}`} />
        )}
        {onTrack !== undefined && (
          <Stat
            label="On Track"
            value={`${onTrack < 0 ? "-" : ""}₹${Math.abs(onTrack).toLocaleString("en-IN")}`}
            color={onTrack >= 0 ? "green" : "red"}
          />
        )}
        {gap !== undefined && (
          <Stat label="Gap" value={`₹${gap.toLocaleString("en-IN")}`} color={gap > 0 ? "red" : "green"} />
        )}

        {/* Completion column */}
        <div className="flex flex-col items-end gap-0.5">
          {posPct > 0 && (
            <motion.p
              className="text-xl md:text-3xl font-black leading-none tracking-tight text-[#00C87A]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            >
              +{posPct}%
            </motion.p>
          )}
          {negPct > 0 && (
            <motion.p
              className="text-xl md:text-3xl font-black leading-none tracking-tight text-[#FF2E0F]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              -{negPct}%
            </motion.p>
          )}
          {posPct === 0 && negPct === 0 && (
            <p className="text-xl md:text-3xl font-black leading-none tracking-tight text-[#474A5B]">0%</p>
          )}
          <p className="text-[9px] uppercase tracking-[0.17em] font-extrabold text-[#474A5B] mt-0.5">
            Completed
          </p>
        </div>
      </div>
    </section>
  );
}
