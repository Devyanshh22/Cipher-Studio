import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { encrypt, decrypt } from './utils/railFence';
import RailGrid from './components/RailGrid';
import PlayfairUI from './components/PlayfairUI';
import OtpUI from './components/OtpUI';
import VigenereUI from './components/VigenereUI';
import CaesarUI from './components/CaesarUI';

// ─── Rail colors ──────────────────────────────────────────────────────────────
export const RAIL_COLORS = [
  '#00f5ff', '#ff00aa', '#aaff00', '#ff6600',
  '#cc00ff', '#ffff00', '#ff3333', '#00ff88',
];

type CipherKey = 'railfence' | 'playfair' | 'otp' | 'vigenere' | 'caesar';

// ─── CipherSelector ───────────────────────────────────────────────────────────
function CipherSelector({ onSelect }: { onSelect: (c: CipherKey) => void }) {
  const ciphers: Array<{
    key: CipherKey;
    name: string;
    sub: string;
    desc: string;
    accent: string;
    tag: string;
  }> = [
    {
      key:    'railfence',
      name:   'RAIL FENCE',
      sub:    'CIPHER',
      desc:   'Zigzag transposition cipher',
      accent: '#00f5ff',
      tag:    'TRANSPOSITION',
    },
    {
      key:    'playfair',
      name:   'PLAYFAIR',
      sub:    'CIPHER',
      desc:   '5×5 digraph substitution cipher',
      accent: '#ff00aa',
      tag:    'SUBSTITUTION',
    },
    {
      key:    'otp',
      name:   'ONE-TIME',
      sub:    'PAD',
      desc:   'Theoretically unbreakable XOR cipher',
      accent: '#ffff00',
      tag:    'PERFECT SECRECY',
    },
    {
      key:    'vigenere',
      name:   'VIGENÈRE',
      sub:    'CIPHER',
      desc:   'Polyalphabetic keyword substitution cipher',
      accent: '#9d00ff',
      tag:    'POLYALPHABETIC',
    },
    {
      key:    'caesar',
      name:   'CAESAR',
      sub:    'CIPHER',
      desc:   'Monoalphabetic shift cipher with frequency analysis',
      accent: '#ff6600',
      tag:    'MONOALPHABETIC',
    },
  ];

  return (
    <div className="app">
      <div className="overlay-grid"  aria-hidden="true" />
      <div className="overlay-scan"  aria-hidden="true" />
      <div className="overlay-sweep" aria-hidden="true" />

      <div className="app-inner selector-inner">
        <header className="header">
          <div className="header-badge">CIPHER STUDIO</div>
          <h1 className="title">
            <span className="title-cipher">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">select a cipher to begin</p>
        </header>

        <div className="selector-grid">
          {ciphers.map((c) => (
            <button
              key={c.key}
              className="selector-card"
              style={{
                '--card-accent':    c.accent,
                '--card-accent-20': c.accent + '20',
                '--card-accent-40': c.accent + '40',
                '--card-accent-08': c.accent + '08',
              } as React.CSSProperties}
              onClick={() => onSelect(c.key)}
            >
              <div className="selector-card-tag"
                style={{ color: c.accent + 'aa', borderColor: c.accent + '30' }}>
                {c.tag}
              </div>
              <div className="selector-card-name">
                <span style={{ color: c.accent, textShadow: `0 0 14px ${c.accent}` }}>
                  {c.name}
                </span>
                <br />
                <span className="selector-card-sub">{c.sub}</span>
              </div>
              <p className="selector-card-desc">{c.desc}</p>
              <div className="selector-card-cta"
                style={{ color: c.accent + 'cc', borderColor: c.accent + '30' }}>
                OPEN →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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

// ─── RailFenceUI ──────────────────────────────────────────────────────────────
function RailFenceUI({ onBack }: { onBack: () => void }) {
  const [inputText,  setInputText]  = useState('WEAREDISCOVEREDFLEEAATONCE');
  const [numRails,   setNumRails]   = useState(3);
  const [mode,       setMode]       = useState<'encrypt' | 'decrypt'>('encrypt');
  const [outputText, setOutputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [animating,    setAnimating]    = useState(false);
  const [animSpeed,    setAnimSpeed]    = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [glitching, setGlitching] = useState(false);
  const [infoOpen,  setInfoOpen]  = useState(false);
  const glitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!inputText.trim()) { setOutputText(''); return; }
    setOutputText(
      mode === 'encrypt' ? encrypt(inputText, numRails) : decrypt(inputText, numRails)
    );
  }, [inputText, numRails, mode]);

  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setAnimating(false);
    setVisibleCount(null);
  }, [inputText, numRails, mode]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (glitchRef.current)   clearTimeout(glitchRef.current);
    };
  }, []);

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

        <header className="header">
          <div className="header-top-row">
            <button className="back-btn" onClick={onBack}>← BACK</button>
            <div className="header-badge">RAIL FENCE CIPHER</div>
            <button
              className={`info-btn ${infoOpen ? 'info-btn-active' : ''}`}
              onClick={() => setInfoOpen((o) => !o)}
              aria-label="About this cipher"
            >?</button>
          </div>

          <h1 className="title">
            <span className="title-cipher">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">classical transposition cipher simulator</p>

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

          {infoOpen && <InfoPanel />}
        </header>

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

        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--green">ZIGZAG VISUALIZATION</span>
            <div className="viz-controls">
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

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState<CipherKey | null>(null);

  if (selected === 'railfence') return <RailFenceUI  onBack={() => setSelected(null)} />;
  if (selected === 'playfair')  return <PlayfairUI   onBack={() => setSelected(null)} />;
  if (selected === 'otp')       return <OtpUI        onBack={() => setSelected(null)} />;
  if (selected === 'vigenere')  return <VigenereUI   onBack={() => setSelected(null)} />;
  if (selected === 'caesar')    return <CaesarUI     onBack={() => setSelected(null)} />;

  return <CipherSelector onSelect={setSelected} />;
}
