import React from 'react';
import { getRailPattern, encrypt, decrypt } from '../utils/railFence';
import './RailGrid.css';

// ─── Constants ────────────────────────────────────────────────────────────────
export const RAIL_COLORS = [
  '#00f5ff', // 0 cyan
  '#ff00aa', // 1 magenta
  '#aaff00', // 2 lime
  '#ff6600', // 3 orange
  '#cc00ff', // 4 violet
  '#ffff00', // 5 yellow
  '#ff3333', // 6 red
  '#00ff88', // 7 mint
];

const MAX_COLS  = 40;
const CELL_SIZE = 36;
const CELL_GAP  = 6;
const STEP      = CELL_SIZE + CELL_GAP; // 42 px per slot

// ─── RailGrid ─────────────────────────────────────────────────────────────────
export default function RailGrid({ inputText, numRails, mode, visibleCount = null }) {
  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!inputText) {
    return (
      <div className="rg-empty">
        START TYPING TO SEE THE CIPHER IN ACTION
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const displayText = inputText.slice(0, MAX_COLS);
  const truncated   = inputText.length > MAX_COLS;
  const cols        = displayText.length;
  const pattern     = getRailPattern(cols, numRails);

  // Canvas dimensions — tight fit around all cells
  const canvasW = (cols - 1)     * STEP + CELL_SIZE;
  const canvasH = (numRails - 1) * STEP + CELL_SIZE;

  // ── Apply visibleCount for animation ────────────────────────────────────────
  const displayCount = visibleCount === null ? cols : Math.min(visibleCount, cols);

  // ── Build cell descriptors ───────────────────────────────────────────────────
  const cells = Array.from({ length: cols }, (_, i) => {
    const rail = pattern[i];
    return {
      char: displayText[i],
      rail,
      x:  i    * STEP,
      y:  rail * STEP,
      cx: i    * STEP + CELL_SIZE / 2,
      cy: rail * STEP + CELL_SIZE / 2,
    };
  });

  // ── Build zigzag connector lines ─────────────────────────────────────────────
  const lines = cells.slice(0, Math.max(0, displayCount - 1)).map((c, i) => ({
    x1: c.cx,
    y1: c.cy,
    x2: cells[i + 1].cx,
    y2: cells[i + 1].cy,
    color: RAIL_COLORS[c.rail],
  }));

  // ── Per-rail character groups (legend) ───────────────────────────────────────
  const rails = Array.from({ length: numRails }, (_, r) => ({
    r,
    color: RAIL_COLORS[r],
    chars: displayText.split('').filter((_, i) => pattern[i] === r).join(''),
  }));

  // ── Step 3 output ─────────────────────────────────────────────────────────────
  const fullOutput    = mode === 'encrypt'
    ? encrypt(inputText, numRails)
    : decrypt(inputText, numRails);
  const step3Preview  = fullOutput.length > 56
    ? fullOutput.slice(0, 56) + '…'
    : fullOutput;
  const step3Color    = mode === 'encrypt' ? '#ff00aa' : '#00f5ff';

  return (
    <div className="rg-wrap">

      {/* ── Zigzag Grid ──────────────────────────────────────────────────────── */}
      <div className="rg-scroll">
        <div
          className="rg-canvas"
          style={{ width: canvasW, height: canvasH }}
        >
          {/* SVG layer: row backgrounds + connector lines */}
          <svg
            className="rg-svg"
            width={canvasW}
            height={canvasH}
            aria-hidden="true"
          >
            {/* Subtle row highlight strips */}
            {Array.from({ length: numRails }, (_, r) => (
              <rect
                key={r}
                x={0}
                y={r * STEP}
                width={canvasW}
                height={CELL_SIZE}
                rx={4}
                fill={RAIL_COLORS[r] + '0b'}
                stroke={RAIL_COLORS[r] + '22'}
                strokeWidth={1}
              />
            ))}

            {/* Zigzag connector lines */}
            {lines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1}
                x2={l.x2} y2={l.y2}
                stroke={l.color}
                strokeWidth={1.5}
                strokeOpacity={0.4}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Character cell divs (sit above SVG via DOM order) */}
          {cells.slice(0, displayCount).map((cell, i) => (
            <div
              key={i}
              className="rg-cell"
              style={{
                left:            cell.x,
                top:             cell.y,
                color:           RAIL_COLORS[cell.rail],
                borderColor:     RAIL_COLORS[cell.rail] + '55',
                backgroundColor: RAIL_COLORS[cell.rail] + '14',
              }}
            >
              {cell.char === ' ' ? '·' : cell.char}
            </div>
          ))}
        </div>

        {/* Truncation notice */}
        {truncated && (
          <p className="rg-truncated">
            ⚠ displaying first {MAX_COLS} of {inputText.length} characters
          </p>
        )}
      </div>

      {/* ── Rail Legend ──────────────────────────────────────────────────────── */}
      <div className="rg-legend">
        {rails.map(({ r, color, chars }) => (
          <div key={r} className="rg-rail-row">
            <span
              className="rg-rail-dot"
              style={{ background: color, boxShadow: `0 0 5px ${color}` }}
            />
            <span className="rg-rail-label" style={{ color }}>
              RAIL {r}
            </span>
            <span
              className="rg-rail-chars"
              style={{
                color,
                borderColor: color + '33',
                background:  color + '0f',
              }}
            >
              {chars || <span className="rg-rail-empty">—</span>}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step-by-step breakdown ───────────────────────────────────────────── */}
      <div className="rg-steps">
        <div className="rg-step">
          <span className="rg-step-num">01</span>
          <span className="rg-step-text">
            Characters written in zigzag across{' '}
            <strong style={{ color: '#00f5ff' }}>{numRails}</strong> rails
          </span>
        </div>

        <span className="rg-step-arrow" aria-hidden="true">→</span>

        <div className="rg-step">
          <span className="rg-step-num">02</span>
          <span className="rg-step-text">
            Each rail read <strong style={{ color: '#00f5ff' }}>left to right</strong>
          </span>
        </div>

        <span className="rg-step-arrow" aria-hidden="true">→</span>

        <div className="rg-step">
          <span className="rg-step-num">03</span>
          <span className="rg-step-text">
            Rails joined in order ={' '}
            <span className="rg-step-output" style={{ color: step3Color }}>
              {step3Preview}
            </span>
          </span>
        </div>
      </div>

    </div>
  );
}
