import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { encrypt, decrypt } from './utils/railFence';

// ─── Neon rail color palette ──────────────────────────────────────────────────
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

// ─── RailsSlider ──────────────────────────────────────────────────────────────
function RailsSlider({ value, onChange }) {
  return (
    <div className="rails-slider-wrap">
      <div className="rails-label-row">
        <span className="control-label">RAILS</span>
        <span className="rails-value" style={{ color: RAIL_COLORS[value - 2] || RAIL_COLORS[0] }}>
          {value}
        </span>
      </div>

      <input
        type="range"
        min={2}
        max={8}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rails-range"
        style={{ '--thumb-color': RAIL_COLORS[value - 2] || RAIL_COLORS[0] }}
      />

      <div className="rails-ticks">
        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
          <span
            key={n}
            className={`tick ${n === value ? 'tick-active' : ''}`}
            style={n === value ? { color: RAIL_COLORS[n - 2] } : {}}
          >
            {n}
          </span>
        ))}
      </div>

      {/* Rail color dots */}
      <div className="rail-dots">
        {Array.from({ length: value }, (_, i) => (
          <span
            key={i}
            className="rail-dot"
            style={{ background: RAIL_COLORS[i], boxShadow: `0 0 6px ${RAIL_COLORS[i]}` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ModeToggle ───────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle">
      <span className="control-label">MODE</span>
      <div className="toggle-buttons">
        <button
          className={`toggle-btn ${mode === 'encrypt' ? 'active-encrypt' : ''}`}
          onClick={() => onChange('encrypt')}
        >
          ENCRYPT
        </button>
        <button
          className={`toggle-btn ${mode === 'decrypt' ? 'active-decrypt' : ''}`}
          onClick={() => onChange('decrypt')}
        >
          DECRYPT
        </button>
      </div>
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [state, setState] = useState('idle'); // idle | copied | error

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

  const label = state === 'copied' ? 'COPIED ✓' : state === 'error' ? 'FAILED ✗' : 'COPY';
  const colorClass = state === 'copied' ? 'copy-ok' : state === 'error' ? 'copy-err' : '';

  return (
    <button
      className={`copy-btn ${colorClass}`}
      onClick={handleClick}
      disabled={!text}
    >
      {label}
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [inputText, setInputText]   = useState('WEAREDISCOVEREDFLEEAATONCE');
  const [numRails,  setNumRails]    = useState(3);
  const [mode,      setMode]        = useState('encrypt');
  const [outputText, setOutputText] = useState('');
  const textareaRef = useRef(null);

  // ── Real-time output computation ──────────────────────────────────────────
  useEffect(() => {
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }
    const result =
      mode === 'encrypt'
        ? encrypt(inputText, numRails)
        : decrypt(inputText, numRails);
    setOutputText(result);
  }, [inputText, numRails, mode]);

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    textareaRef.current?.focus();
  };

  return (
    <div className="app">

      {/* ── Scanline & grid overlays ────────────────────────────────────── */}
      <div className="overlay-grid"  aria-hidden="true" />
      <div className="overlay-scan"  aria-hidden="true" />

      <div className="app-inner">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="header">
          <div className="header-badge">TRANSPOSITION CIPHER</div>
          <h1 className="title">
            <span className="title-rail">RAIL</span>
            <span className="title-fence">FENCE</span>
            {' '}
            <span className="title-cipher">CIPHER</span>
            {' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">classical transposition cipher simulator</p>

          {/* Key pill */}
          <div className="key-pill">
            <span className="key-label">KEY</span>
            <span
              className="key-value"
              style={{ color: RAIL_COLORS[numRails - 2] || RAIL_COLORS[0], textShadow: `0 0 10px ${RAIL_COLORS[numRails - 2] || RAIL_COLORS[0]}` }}
            >
              {numRails}
            </span>
            <span className="key-unit">RAILS</span>
          </div>
        </header>

        {/* ── Controls row ────────────────────────────────────────────────── */}
        <section className="controls-row">

          {/* Input area */}
          <div className="input-wrap">
            <label className="panel-label" htmlFor="rf-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="rf-input"
              ref={textareaRef}
              className="input-area"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                mode === 'encrypt'
                  ? 'Type your plaintext here…'
                  : 'Paste ciphertext to decrypt…'
              }
              spellCheck={false}
              autoComplete="off"
            />
            <div className="input-meta">
              <span className="char-count">{inputText.length} chars</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="controls-panel">
            <RailsSlider value={numRails} onChange={setNumRails} />
            <div className="divider" />
            <ModeToggle mode={mode} onChange={setMode} />
            <div className="divider" />
            <button className="clear-btn" onClick={handleClear}>
              CLEAR
            </button>
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
          <div
            className={`output-text ${mode === 'encrypt' ? 'output-encrypt' : 'output-decrypt'}`}
          >
            {outputText || <span className="output-empty">— awaiting input —</span>}
          </div>
          {outputText && (
            <div className="output-meta">
              <span>{inputText.length} → {outputText.length} chars</span>
              <span className="output-key-note">
                key: <strong style={{ color: RAIL_COLORS[numRails - 2] }}>{numRails} rails</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── Visualization placeholder ────────────────────────────────────── */}
        <section className="viz-placeholder">
          <div className="viz-inner">
            <span className="viz-icon">⬡</span>
            <span className="viz-label">VISUALIZATION</span>
            <span className="viz-coming">COMING IN PHASE 3</span>
          </div>
        </section>

      </div>
    </div>
  );
}
