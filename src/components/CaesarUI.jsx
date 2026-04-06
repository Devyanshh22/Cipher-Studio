import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  encrypt, decrypt,
  getFrequencies, getBestGuessShift,
  ENGLISH_FREQUENCIES,
} from '../utils/caesar';
import './CaesarUI.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALPHA  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ORANGE = '#ff6600';
const CELL_W = 29; // px width per ring cell + gap

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [state, setState] = useState('idle');
  const handleClick = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 1500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 1500);
    }
  };
  const label      = state === 'copied' ? 'COPIED ✓' : state === 'error' ? 'FAILED ✗' : 'COPY';
  const extraClass = state === 'copied' ? 'copy-ok'  : state === 'error' ? 'copy-err'  : '';
  return (
    <button className={`copy-btn ${extraClass}`} onClick={handleClick} disabled={!text}>
      {label}
    </button>
  );
}

// ─── FormulaBanner ────────────────────────────────────────────────────────────
function FormulaBanner({ mode, shift, firstChar }) {
  const formula = mode === 'encrypt'
    ? `C = (P + ${shift}) mod 26`
    : `P = (C − ${shift} + 26) mod 26`;

  let example = null;
  if (firstChar) {
    const upper = firstChar.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const p    = upper.charCodeAt(0) - 65;
      const s    = ((shift % 26) + 26) % 26;
      const c    = mode === 'encrypt'
        ? (p + s) % 26
        : ((p - s) + 26) % 26;
      const resChar = String.fromCharCode(c + 65);
      if (mode === 'encrypt') {
        example = `${upper}(${p}) + ${shift} = ${resChar}(${c})`;
      } else {
        example = `${upper}(${p}) − ${shift} + 26 = ${resChar}(${c})`;
      }
    }
  }

  return (
    <div className="csr-formula-banner">
      <span className="csr-formula-eq">{formula}</span>
      {example && (
        <span className="csr-formula-example">{example}</span>
      )}
    </div>
  );
}

// ─── AlphabetRing ─────────────────────────────────────────────────────────────
// Renders two rows: plain (fixed) and cipher (shifted).
// The cipher row slides to align shifted alphabet.
function AlphabetRing({ shift, highlightIdx }) {
  // Double the alphabet so we can slide without gaps
  const doubleAlpha = [...ALPHA, ...ALPHA];
  const normalizedShift = ((shift % 26) + 26) % 26;

  return (
    <div className="csr-ring-wrap">
      <div className="csr-ring-title">ALPHABET RING</div>

      <div className="csr-ring-viewport">
        {/* Plain row — always fixed at A–Z */}
        <div className="csr-ring-row" style={{ transform: 'translateX(0)' }}>
          {ALPHA.map((ch, i) => (
            <div
              key={i}
              className={`csr-ring-cell csr-ring-plain${i === highlightIdx ? ' csr-ring-cell-active-plain' : ''}`}
            >
              {ch}
            </div>
          ))}
        </div>

        {/* Arrow connector */}
        <div className="csr-ring-connector">
          <span className="csr-ring-arrow">▼</span>
        </div>

        {/* Cipher row — shifted left by normalizedShift cells */}
        <div
          className="csr-ring-row"
          style={{ transform: `translateX(-${normalizedShift * CELL_W}px)` }}
        >
          {doubleAlpha.map((ch, i) => {
            const cipherIdx = (i - normalizedShift + 52) % 26;
            const isActive = cipherIdx === highlightIdx;
            return (
              <div
                key={i}
                className={`csr-ring-cell csr-ring-cipher${isActive ? ' csr-ring-cell-active-cipher' : ''}`}
              >
                {ch}
              </div>
            );
          })}
        </div>
      </div>

      <div className="csr-ring-labels">
        <span className="csr-ring-label" style={{ color: 'rgba(0,245,255,0.4)' }}>PLAIN</span>
        <span className="csr-ring-label" style={{ color: 'rgba(255,102,0,0.4)' }}>CIPHER (shift +{normalizedShift})</span>
      </div>
    </div>
  );
}

// ─── FrequencyChart ───────────────────────────────────────────────────────────
function FrequencyChart({ ciphertext, onApplyBestGuess }) {
  const freqs    = useMemo(() => getFrequencies(ciphertext), [ciphertext]);
  const bestShift = useMemo(() => getBestGuessShift(ciphertext), [ciphertext]);
  const hasText  = ciphertext.replace(/[^a-zA-Z]/g, '').length > 0;

  // Find max for normalization
  const maxCipher = useMemo(() =>
    Math.max(...Object.values(freqs), 0.1)
  , [freqs]);
  const maxEng = Math.max(...Object.values(ENGLISH_FREQUENCIES));

  // Most frequent cipher letter (for labeling)
  const mostFreqLetter = useMemo(() => {
    if (!hasText) return null;
    let best = 'E'; let bestVal = -1;
    for (const [l, v] of Object.entries(freqs)) {
      if (v > bestVal) { bestVal = v; best = l; }
    }
    return best;
  }, [freqs, hasText]);

  return (
    <div className="csr-freq-wrap">
      <div className="csr-freq-header">
        <span className="csr-freq-title">FREQUENCY ANALYSIS</span>
        <div className="csr-best-guess">
          {hasText && mostFreqLetter && (
            <span>
              '{mostFreqLetter}' → 'E' &nbsp;→&nbsp; shift <strong style={{ color: ORANGE }}>{bestShift}</strong>
            </span>
          )}
          <button
            className="csr-best-guess-btn"
            onClick={() => onApplyBestGuess(bestShift)}
            disabled={!hasText}
          >
            APPLY BEST GUESS
          </button>
        </div>
      </div>

      <div className="csr-freq-chart">
        {ALPHA.map((ch) => {
          const cipherPct = freqs[ch] || 0;
          const engPct    = ENGLISH_FREQUENCIES[ch] || 0;
          const cipherH   = hasText ? (cipherPct / maxCipher) * 64 : 0;
          const engH      = (engPct / maxEng) * 64;
          const isActive  = ch === mostFreqLetter && hasText;

          return (
            <div key={ch} className="csr-freq-col">
              <div className="csr-freq-bar-wrap">
                {/* English reference bar (behind) */}
                <div
                  className="csr-freq-bar-eng"
                  style={{ height: `${engH}px` }}
                />
                {/* Cipher frequency bar (in front) */}
                <div
                  className="csr-freq-bar-cipher"
                  style={{
                    height: `${cipherH}px`,
                    background: isActive
                      ? `rgba(255,102,0,0.85)`
                      : `rgba(255,102,0,0.4)`,
                    boxShadow: isActive ? `0 0 8px rgba(255,102,0,0.5)` : 'none',
                  }}
                />
              </div>
              <span className={`csr-freq-letter${isActive ? ' csr-freq-letter-active' : ''}`}>
                {ch}
              </span>
            </div>
          );
        })}
      </div>

      <div className="csr-freq-legend">
        <div className="csr-freq-legend-item">
          <div className="csr-freq-legend-dot" style={{ background: 'rgba(255,102,0,0.6)' }} />
          CIPHER FREQ
        </div>
        <div className="csr-freq-legend-item">
          <div className="csr-freq-legend-dot" style={{ background: 'rgba(255,255,255,0.12)' }} />
          ENGLISH REF
        </div>
      </div>
    </div>
  );
}

// ─── CaesarUI ─────────────────────────────────────────────────────────────────
export default function CaesarUI({ onBack }) {
  const [inputText,  setInputText]  = useState('THE QUICK BROWN FOX');
  const [shift,      setShift]      = useState(13);
  const [mode,       setMode]       = useState('encrypt');
  const [outputText, setOutputText] = useState('');
  const [glitching,  setGlitching]  = useState(false);
  const [infoOpen,   setInfoOpen]   = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const glitchRef = useRef(null);
  const cycleRef  = useRef(null);

  // First alpha char for formula example
  const firstAlphaChar = useMemo(() => {
    for (const ch of inputText) {
      if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) return ch;
    }
    return null;
  }, [inputText]);

  // ── Compute output ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!inputText.trim()) { setOutputText(''); return; }
    setOutputText(
      mode === 'encrypt' ? encrypt(inputText, shift) : decrypt(inputText, shift)
    );
  }, [inputText, shift, mode]);

  // ── Glitch on output change ────────────────────────────────────────────────
  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  // ── Cycle highlight through alphabet ──────────────────────────────────────
  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    cycleRef.current = setInterval(() => {
      setHighlightIdx(i => (i + 1) % 26);
    }, 500);
    return () => clearInterval(cycleRef.current);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (cycleRef.current)  clearInterval(cycleRef.current);
      if (glitchRef.current) clearTimeout(glitchRef.current);
    };
  }, []);

  const sliderPct = (shift / 25) * 100;

  // For frequency analysis, use the ciphertext (output when encrypting, input when decrypting)
  const analysisText = mode === 'encrypt' ? outputText : inputText;

  return (
    <div className="app">
      <div className="overlay-grid"  aria-hidden="true" />
      <div className="overlay-scan"  aria-hidden="true" />
      <div className="overlay-sweep" aria-hidden="true" />

      <div className="app-inner">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <header className="header">
          <div className="header-top-row">
            <button className="back-btn" onClick={onBack}>← BACK</button>
            <div className="header-badge">CAESAR CIPHER</div>
            <button
              className={`info-btn csr-info-btn ${infoOpen ? 'info-btn-active csr-info-btn-active' : ''}`}
              onClick={() => setInfoOpen(o => !o)}
              aria-label="About this cipher"
            >?</button>
          </div>

          <h1 className="title">
            <span className="title-caesar">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">monoalphabetic shift substitution cipher</p>

          {infoOpen && (
            <div className="info-panel csr-info-panel">
              <div className="info-section">
                <h3 className="info-heading csr-heading">What is the Caesar Cipher?</h3>
                <p className="info-body">
                  One of the simplest <strong>substitution ciphers</strong>, attributed to Julius
                  Caesar. Each letter in the plaintext is shifted a fixed number of positions down
                  the alphabet. With a shift of 13 it becomes the well-known <strong>ROT13</strong>.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading csr-heading">Historical Use</h3>
                <p className="info-body">
                  Used by Julius Caesar around <strong>58 BC</strong> to communicate with his
                  generals. Suetonius records that Caesar used a shift of 3. It remained in use for
                  centuries due to the low literacy of attackers, not any real cryptographic strength.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading csr-heading">Main Weakness</h3>
                <p className="info-body">
                  Only <strong>25 possible keys</strong> — trivially brute-forced. It also preserves
                  letter frequencies, making it vulnerable to <strong>frequency analysis</strong>:
                  the most common ciphertext letter likely corresponds to 'E', instantly revealing
                  the shift.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ── Controls row ──────────────────────────────────────────────────── */}
        <section className="controls-row">
          <div className="input-wrap">
            <label className="panel-label" htmlFor="csr-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="csr-input"
              className="input-area"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={mode === 'encrypt' ? 'Type your plaintext…' : 'Paste ciphertext to decrypt…'}
              spellCheck={false}
              autoComplete="off"
            />
            <div className="input-meta">
              <span className="char-count">{inputText.length} chars</span>
            </div>
          </div>

          <div className="controls-panel">
            {/* Shift slider */}
            <div className="csr-shift-row">
              <div className="csr-shift-number">{shift}</div>
              <div className="csr-shift-controls">
                <div className="csr-shift-label-row">
                  <span className="csr-shift-sublabel">SHIFT</span>
                  <span className="csr-shift-name">
                    {shift === 13 ? 'ROT13' : shift === 0 ? 'IDENTITY' : `+${shift}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={shift}
                  onChange={e => setShift(Number(e.target.value))}
                  className="csr-slider"
                  style={{ '--pct': sliderPct }}
                />
                <div className="csr-shift-label-row">
                  <span className="csr-shift-sublabel">0</span>
                  <span className="csr-shift-sublabel">25</span>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Mode toggle */}
            <div className="mode-toggle">
              <span className="control-label">MODE</span>
              <div className="toggle-buttons">
                <button
                  className={`toggle-btn ${mode === 'encrypt' ? 'active-encrypt' : ''}`}
                  onClick={() => setMode('encrypt')}
                >ENCRYPT</button>
                <button
                  className={`toggle-btn ${mode === 'decrypt' ? 'active-decrypt' : ''}`}
                  onClick={() => setMode('decrypt')}
                >DECRYPT</button>
              </div>
            </div>

            <div className="divider" />

            <button className="clear-btn" onClick={() => { setInputText(''); setOutputText(''); }}>
              CLEAR
            </button>
          </div>
        </section>

        {/* ── Formula banner ────────────────────────────────────────────────── */}
        <FormulaBanner mode={mode} shift={shift} firstChar={firstAlphaChar} />

        {/* ── Output panel ──────────────────────────────────────────────────── */}
        <section className="output-panel">
          <div className="output-header">
            <span className="panel-label">
              {mode === 'encrypt' ? 'CIPHERTEXT OUTPUT' : 'PLAINTEXT OUTPUT'}
            </span>
            <CopyButton text={outputText} />
          </div>
          <div className={[
            'output-text',
            mode === 'encrypt' ? 'output-encrypt' : 'output-decrypt',
            glitching ? 'output-glitch' : '',
          ].join(' ').trim()}>
            {outputText || <span className="output-empty">— awaiting input —</span>}
          </div>
          {outputText && (
            <div className="output-meta">
              <span>{inputText.length} → {outputText.length} chars</span>
              <span className="output-key-note">
                shift: <strong style={{ color: ORANGE }}>{shift}</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── Alphabet Ring ─────────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--orange">ALPHABET RING</span>
          </div>
          <AlphabetRing shift={shift} highlightIdx={highlightIdx} />
        </section>

        {/* ── Frequency Analysis ────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--orange">FREQUENCY ANALYSIS</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              {mode === 'encrypt' ? 'CIPHERTEXT' : 'INPUT'} DISTRIBUTION
            </span>
          </div>
          <FrequencyChart
            ciphertext={analysisText}
            onApplyBestGuess={(s) => {
              setShift(s);
              setMode('decrypt');
            }}
          />
        </section>

      </div>
    </div>
  );
}
