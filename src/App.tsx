import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { encrypt, decrypt } from './utils/railFence';
import RailGrid from './components/RailGrid';

// ─── Rail colors ──────────────────────────────────────────────────────────────
export const RAIL_COLORS = [
  '#00f5ff', '#ff00aa', '#aaff00', '#ff6600',
  '#cc00ff', '#ffff00', '#ff3333', '#00ff88',
];

// ─── RailsSlider ──────────────────────────────────────────────────────────────
function RailsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="rails-slider-wrap">
      <div className="rails-label-row">
        <span className="control-label">RAILS</span>
        <span className="rails-value" style={{ color: RAIL_COLORS[value - 2] }}>
          {value}
        </span>
      </div>
      <input
        type="range" min={2} max={8} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rails-range"
        style={{ '--thumb-color': RAIL_COLORS[value - 2] } as React.CSSProperties}
      />
      <div className="rails-ticks">
        {[2,3,4,5,6,7,8].map((n) => (
          <span key={n}
            className={`tick ${n === value ? 'tick-active' : ''}`}
            style={n === value ? { color: RAIL_COLORS[n - 2] } : {}}>
            {n}
          </span>
        ))}
      </div>
      <div className="rail-dots">
        {Array.from({ length: value }, (_, i) => (
          <span key={i} className="rail-dot"
            style={{ background: RAIL_COLORS[i], boxShadow: `0 0 6px ${RAIL_COLORS[i]}` }} />
        ))}
      </div>
    </div>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: string; onChange: (m: 'encrypt' | 'decrypt') => void }) {
  return (
    <div className="mode-toggle">
      <span className="control-label">MODE</span>
      <div className="toggle-buttons">
        <button className={`toggle-btn ${mode === 'encrypt' ? 'active-encrypt' : ''}`}
          onClick={() => onChange('encrypt')}>ENCRYPT</button>
        <button className={`toggle-btn ${mode === 'decrypt' ? 'active-decrypt' : ''}`}
          onClick={() => onChange('decrypt')}>DECRYPT</button>
      </div>
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
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
  const label     = state === 'copied' ? 'COPIED ✓' : state === 'error' ? 'FAILED ✗' : 'COPY';
  const extraClass = state === 'copied' ? 'copy-ok'  : state === 'error' ? 'copy-err'  : '';
  return (
    <button className={`copy-btn ${extraClass}`} onClick={handleClick} disabled={!text}>
      {label}
    </button>
  );
}

// ─── InfoPanel ────────────────────────────────────────────────────────────────
function InfoPanel() {
  return (
    <div className="info-panel">
      <div className="info-section">
        <h3 className="info-heading">What is the Rail Fence Cipher?</h3>
        <p className="info-body">
          A classical <strong>transposition cipher</strong> that rearranges characters
          by writing them diagonally across a set of "rails" (rows), then reading
          each rail left to right. Unlike substitution ciphers, every character in the
          plaintext appears unchanged in the ciphertext — only the order differs.
        </p>
      </div>
      <div className="info-section">
        <h3 className="info-heading">Historical Use</h3>
        <p className="info-body">
          Used as a basic field cipher during the <strong>American Civil War</strong>.
          Simple enough to perform mentally or with pencil and paper, it saw use for
          rapid, low-stakes communications before being replaced by polyalphabetic and
          machine-based ciphers in the 20th century.
        </p>
      </div>
      <div className="info-section">
        <h3 className="info-heading">Main Weakness</h3>
        <p className="info-body">
          With only <strong>2–8 practical rails</strong>, there are at most <strong>7
          possible keys</strong>. An attacker can try every key in milliseconds —
          making it trivially brute-forceable. It should never be used alone for
          anything sensitive.
        </p>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Core state
  const [inputText,  setInputText]  = useState('WEAREDISCOVEREDFLEEAATONCE');
  const [numRails,   setNumRails]   = useState(3);
  const [mode,       setMode]       = useState<'encrypt' | 'decrypt'>('encrypt');
  const [outputText, setOutputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Animation state
  const [visibleCount, setVisibleCount] = useState<number | null>(null); // null = show all
  const [animating,    setAnimating]    = useState(false);
  const [animSpeed,    setAnimSpeed]    = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [glitching, setGlitching] = useState(false);
  const [infoOpen,  setInfoOpen]  = useState(false);
  const glitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Real-time output ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!inputText.trim()) { setOutputText(''); return; }
    setOutputText(
      mode === 'encrypt' ? encrypt(inputText, numRails) : decrypt(inputText, numRails)
    );
  }, [inputText, numRails, mode]);

  // ── Glitch on output change ────────────────────────────────────────────────
  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  // ── Reset animation when inputs change ────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAnimating(false);
    setVisibleCount(null);
  }, [inputText, numRails, mode]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (glitchRef.current)   clearTimeout(glitchRef.current);
    };
  }, []);

  // ── Animation controls ─────────────────────────────────────────────────────
  const handleAnimate = () => {
    if (animating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setAnimating(false);
      setVisibleCount(null);
      return;
    }
    if (!inputText) return;
    const maxCount = Math.min(inputText.length, 40);
    setVisibleCount(0);
    setAnimating(true);
    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= maxCount) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setAnimating(false);
        setVisibleCount(null);
      }
    }, animSpeed);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    textareaRef.current?.focus();
  };

  const accentColor = RAIL_COLORS[numRails - 2];

  return (
    <div className="app">
      <div className="overlay-grid"  aria-hidden="true" />
      <div className="overlay-scan"  aria-hidden="true" />
      <div className="overlay-sweep" aria-hidden="true" />

      <div className="app-inner">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="header">
          <div className="header-top-row">
            <div className="header-badge">RAIL FENCE CIPHER</div>
            <button
              className={`info-btn ${infoOpen ? 'info-btn-active' : ''}`}
              onClick={() => setInfoOpen((o) => !o)}
              aria-label="About this cipher"
            >
              ?
            </button>
          </div>

          <h1 className="title">
            <span className="title-cipher">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">classical transposition cipher simulator</p>

          {/* Key badge with tooltip */}
          <div className="key-pill-wrap">
            <div className="key-pill">
              <span className="key-label">KEY</span>
              <span className="key-value" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>
                {numRails}
              </span>
              <span className="key-unit">RAILS</span>
            </div>
            <div className="key-tooltip">
              This number is the shared secret. Anyone with this key can decrypt the message.
            </div>
          </div>

          {/* Collapsible info panel */}
          {infoOpen && <InfoPanel />}
        </header>

        {/* ── Controls row ────────────────────────────────────────────────── */}
        <section className="controls-row">
          <div className="input-wrap">
            <label className="panel-label" htmlFor="rf-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="rf-input" ref={textareaRef} className="input-area"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encrypt' ? 'Type your plaintext here…' : 'Paste ciphertext to decrypt…'}
              spellCheck={false} autoComplete="off"
            />
            <div className="input-meta">
              <span className="char-count">{inputText.length} chars</span>
            </div>
          </div>

          <div className="controls-panel">
            <RailsSlider value={numRails} onChange={setNumRails} />
            <div className="divider" />
            <ModeToggle mode={mode} onChange={setMode} />
            <div className="divider" />
            <button className="clear-btn" onClick={handleClear}>CLEAR</button>
          </div>
        </section>

        {/* ── Output panel ────────────────────────────────────────────────── */}
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
                key: <strong style={{ color: accentColor }}>{numRails} rails</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── Visualization ────────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--green">ZIGZAG VISUALIZATION</span>
            <div className="viz-controls">
              {/* Speed slider */}
              <label className="anim-speed-wrap">
                <span className="control-label">SPEED</span>
                <input
                  type="range" min={50} max={400} step={10} value={animSpeed}
                  onChange={(e) => setAnimSpeed(Number(e.target.value))}
                  className="anim-speed-range"
                  disabled={animating}
                />
                <span className="anim-speed-val">{animSpeed}ms</span>
              </label>
              {/* Animate / Reset button */}
              <button
                className={`anim-btn ${animating ? 'anim-btn-reset' : ''}`}
                onClick={handleAnimate}
                disabled={!inputText}
              >
                {animating ? 'RESET' : 'ANIMATE'}
              </button>
            </div>
          </div>

          {inputText.length > 40 && !animating && (
            <span className="viz-cap-note">showing first 40 chars</span>
          )}

          <RailGrid
            inputText={inputText}
            numRails={numRails}
            mode={mode}
            visibleCount={visibleCount}
          />
        </section>

      </div>
    </div>
  );
}
