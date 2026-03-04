import React, { useState, useEffect, useRef } from 'react';
import { encrypt, decrypt, generateKey, getSteps } from '../utils/otp';
import './OtpUI.css';

const RAIL_COLORS = [
  '#00f5ff', '#ff00aa', '#aaff00', '#ff6600',
  '#cc00ff', '#ffff00', '#ff3333', '#00ff88',
];

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

// ─── XOR Table visualization ──────────────────────────────────────────────────
function XorTable({ steps }) {
  const MAX_SHOW = 40;
  const visible  = steps.slice(0, MAX_SHOW);
  const truncated = steps.length > MAX_SHOW;

  if (steps.length === 0) {
    return (
      <div className="rg-empty" style={{ minHeight: 100 }}>
        ENTER TEXT AND KEY TO SEE XOR TABLE
      </div>
    );
  }

  return (
    <div className="otp-table-wrap">
      <div className="otp-table">
        {/* Header row */}
        <div className="otp-th">#</div>
        <div className="otp-th">CHAR</div>
        <div className="otp-th">CODE</div>
        <div className="otp-th">XOR</div>
        <div className="otp-th">KEY</div>
        <div className="otp-th">CODE</div>
        <div className="otp-th otp-th-eq">=</div>
        <div className="otp-th">HEX</div>

        {/* Data rows */}
        {visible.map((s, i) => {
          const color = RAIL_COLORS[i % RAIL_COLORS.length];
          return (
            <React.Fragment key={i}>
              <div className="otp-td otp-td-idx" style={{ color: `${color}55` }}>{i + 1}</div>
              <div className="otp-td otp-td-char" style={{ color, borderColor: `${color}33`, background: `${color}10` }}>
                {s.char === ' ' ? '·' : s.char}
              </div>
              <div className="otp-td otp-td-num" style={{ color: `${color}88` }}>{s.charCode}</div>
              <div className="otp-td otp-td-op">⊕</div>
              <div className="otp-td otp-td-char" style={{ color: '#ff6600', borderColor: 'rgba(255,102,0,0.3)', background: 'rgba(255,102,0,0.08)' }}>
                {s.keyChar === ' ' ? '·' : s.keyChar}
              </div>
              <div className="otp-td otp-td-num" style={{ color: 'rgba(255,102,0,0.55)' }}>{s.keyCode}</div>
              <div className="otp-td otp-td-eq" style={{ color: `${color}55` }}>=</div>
              <div className="otp-td otp-td-hex" style={{ color, borderColor: `${color}33`, background: `${color}0a` }}>
                {s.hexByte}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {truncated && (
        <p className="rg-truncated">⚠ showing first {MAX_SHOW} of {steps.length} characters</p>
      )}
    </div>
  );
}

// ─── OtpUI ────────────────────────────────────────────────────────────────────
export default function OtpUI({ onBack }) {
  const [inputText,  setInputText]  = useState('HELLO WORLD');
  const [otpKey,     setOtpKey]     = useState('');
  const [mode,       setMode]       = useState('encrypt');
  const [outputText, setOutputText] = useState('');
  const [steps,      setSteps]      = useState([]);
  const [glitching,  setGlitching]  = useState(false);
  const [infoOpen,   setInfoOpen]   = useState(false);
  const glitchRef = useRef(null);

  // Auto-generate a key on first mount
  useEffect(() => {
    setOtpKey(generateKey(11));
  }, []);

  // ── Compute output + steps ──────────────────────────────────────────────────
  useEffect(() => {
    if (!inputText || !otpKey) {
      setOutputText('');
      setSteps([]);
      return;
    }
    if (mode === 'encrypt') {
      const out = encrypt(inputText, otpKey);
      setOutputText(out);
      setSteps(getSteps(inputText, otpKey));
    } else {
      const out = decrypt(inputText, otpKey);
      setOutputText(out);
      // For decrypt, show steps of the decrypted plaintext
      if (out) setSteps(getSteps(out, otpKey));
      else     setSteps([]);
    }
  }, [inputText, otpKey, mode]);

  // ── Glitch on output change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  const handleGenerateKey = () => {
    const len = mode === 'encrypt' ? inputText.length : Math.max(8, inputText.length / 2);
    setOtpKey(generateKey(Math.max(1, Math.round(len))));
  };

  return (
    <div className="app">
      <div className="overlay-grid"  aria-hidden="true" />
      <div className="overlay-scan"  aria-hidden="true" />
      <div className="overlay-sweep" aria-hidden="true" />

      <div className="app-inner">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="header">
          <div className="header-top-row">
            <button className="back-btn" onClick={onBack}>← BACK</button>
            <div className="header-badge">ONE-TIME PAD CIPHER</div>
            <button
              className={`info-btn ${infoOpen ? 'info-btn-active' : ''}`}
              onClick={() => setInfoOpen(o => !o)}
              aria-label="About this cipher"
            >?</button>
          </div>

          <h1 className="title">
            <span className="title-otp">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">theoretically unbreakable XOR cipher</p>

          {/* Warning badge */}
          <div className="otp-warning">
            ⚠ KEY MUST BE TRULY RANDOM AND NEVER REUSED — otherwise security is broken
          </div>

          {infoOpen && (
            <div className="info-panel">
              <div className="info-section">
                <h3 className="info-heading">What is the One-Time Pad?</h3>
                <p className="info-body">
                  A cipher where each character is XOR'd with a key character.
                  When the key is <strong>truly random, at least as long as the message,
                  and never reused</strong>, it is mathematically proven to be
                  unbreakable — not even with infinite computing power.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading">Historical Use</h3>
                <p className="info-body">
                  Used in the <strong>Moscow–Washington hotline</strong> during the Cold War.
                  Intelligence agencies used physical one-time pads — sheets of random keys
                  destroyed after a single use. Perfectly secure in theory, but operationally
                  difficult due to key distribution.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading">Main Weakness</h3>
                <p className="info-body">
                  Security breaks instantly if the key is <strong>reused, predictable,
                  or shorter than the message</strong> (cycled key = Vigenère cipher,
                  which is breakable). Key distribution is also a major operational challenge.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ── Controls row ────────────────────────────────────────────────── */}
        <section className="controls-row">
          <div className="input-wrap">
            <label className="panel-label" htmlFor="otp-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'HEX CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="otp-input"
              className="input-area"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                mode === 'encrypt'
                  ? 'Type your plaintext here…'
                  : 'Paste hex ciphertext to decrypt (e.g. 4A2F…)'
              }
              spellCheck={false}
              autoComplete="off"
            />
            <div className="input-meta">
              <span className="char-count">{inputText.length} chars</span>
            </div>
          </div>

          <div className="controls-panel">
            {/* Key input */}
            <div className="otp-key-wrap">
              <div className="otp-key-label-row">
                <span className="control-label">KEY</span>
                <button className="otp-gen-btn" onClick={handleGenerateKey}>
                  GENERATE
                </button>
              </div>
              <textarea
                className="otp-key-input"
                value={otpKey}
                onChange={e => setOtpKey(e.target.value)}
                placeholder="Enter or generate key…"
                spellCheck={false}
                rows={3}
              />
              <span className="char-count" style={{ textAlign: 'right' }}>
                {otpKey.length} chars
                {mode === 'encrypt' && inputText.length > 0 && otpKey.length < inputText.length && (
                  <span className="otp-key-short"> ⚠ shorter than message (cycles)</span>
                )}
              </span>
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

        {/* ── Output panel ────────────────────────────────────────────────── */}
        <section className="output-panel">
          <div className="output-header">
            <span className="panel-label">
              {mode === 'encrypt' ? 'HEX CIPHERTEXT OUTPUT' : 'PLAINTEXT OUTPUT'}
            </span>
            <CopyButton text={outputText} />
          </div>
          <div className={[
            'output-text',
            mode === 'encrypt' ? 'output-encrypt' : 'output-decrypt',
            glitching ? 'output-glitch' : '',
            'otp-output-text',
          ].join(' ').trim()}>
            {outputText || <span className="output-empty">— awaiting input —</span>}
          </div>
          {outputText && (
            <div className="output-meta">
              <span>{inputText.length} chars → {outputText.length} chars</span>
              <span className="output-key-note">
                key: <strong style={{ color: '#aaff00' }}>{otpKey.length} chars</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── XOR Visualization ────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--yellow">XOR VISUALIZATION</span>
          </div>
          <XorTable steps={steps} />
        </section>

      </div>
    </div>
  );
}
