import React, { useState, useEffect, useRef } from 'react';
import { buildMatrix, encrypt, decrypt, getSteps } from '../utils/playfair';
import './PlayfairUI.css';

const RULE_LABELS = {
  row:  'Same row → shift right',
  col:  'Same col → shift down',
  rect: 'Rectangle → swap columns',
};

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

// ─── KeyMatrix ────────────────────────────────────────────────────────────────
function KeyMatrix({ matrix, highlightA, highlightB }) {
  return (
    <div className="pf-matrix-wrap">
      <div className="pf-matrix">
        {matrix.map((row, r) =>
          row.map((ch, c) => {
            const isA = highlightA && highlightA.row === r && highlightA.col === c;
            const isB = highlightB && highlightB.row === r && highlightB.col === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`pf-cell ${isA ? 'pf-cell-a' : ''} ${isB ? 'pf-cell-b' : ''}`}
              >
                {ch}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── PlayfairUI ───────────────────────────────────────────────────────────────
export default function PlayfairUI({ onBack }) {
  const [inputText,  setInputText]  = useState('HIDETHETREASURE');
  const [keyword,    setKeyword]    = useState('MONARCHY');
  const [mode,       setMode]       = useState('encrypt');
  const [outputText, setOutputText] = useState('');
  const [steps,      setSteps]      = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [glitching,  setGlitching]  = useState(false);
  const [infoOpen,   setInfoOpen]   = useState(false);
  const glitchRef = useRef(null);

  // ── Compute output + steps ──────────────────────────────────────────────────
  useEffect(() => {
    if (!inputText.trim() || !keyword.trim()) {
      setOutputText('');
      setSteps([]);
      return;
    }
    const out = mode === 'encrypt'
      ? encrypt(inputText, keyword)
      : decrypt(inputText, keyword);
    setOutputText(out);
    setSteps(getSteps(inputText, keyword, mode));
    setActiveStep(0);
  }, [inputText, keyword, mode]);

  // ── Glitch on output change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  const matrix = keyword ? buildMatrix(keyword) : buildMatrix('KEYWORD');
  const currentStep = steps[activeStep] || null;

  const highlightA = currentStep ? currentStep.posA : null;
  const highlightB = currentStep ? currentStep.posB : null;

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
            <div className="header-badge">PLAYFAIR CIPHER</div>
            <button
              className={`info-btn ${infoOpen ? 'info-btn-active' : ''}`}
              onClick={() => setInfoOpen(o => !o)}
              aria-label="About this cipher"
            >?</button>
          </div>

          <h1 className="title">
            <span className="title-playfair">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">5×5 digraph substitution cipher</p>

          {infoOpen && (
            <div className="info-panel">
              <div className="info-section">
                <h3 className="info-heading">What is the Playfair Cipher?</h3>
                <p className="info-body">
                  A <strong>digraph substitution cipher</strong> invented by Charles Wheatstone
                  in 1854 and popularized by Lord Playfair. It encrypts pairs of letters using
                  a 5×5 matrix built from a keyword — making frequency analysis much harder
                  than simple monoalphabetic ciphers.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading">Historical Use</h3>
                <p className="info-body">
                  Used extensively by <strong>British forces in WWI and WWII</strong>, and by
                  Australian forces in WWII. Its relative simplicity made it practical in the
                  field while offering better security than single-character substitution ciphers.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading">Main Weakness</h3>
                <p className="info-body">
                  The 5×5 matrix means <strong>J is treated as I</strong>. Digraph frequency
                  analysis can crack it with enough ciphertext (~200+ chars). Double letters in
                  the plaintext introduce padding X characters that can leak information.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ── Controls row ────────────────────────────────────────────────── */}
        <section className="controls-row">
          <div className="input-wrap">
            <label className="panel-label" htmlFor="pf-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="pf-input"
              className="input-area"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={mode === 'encrypt' ? 'Type your plaintext here…' : 'Paste ciphertext to decrypt…'}
              spellCheck={false}
              autoComplete="off"
            />
            <div className="input-meta">
              <span className="char-count">{inputText.length} chars</span>
            </div>
          </div>

          <div className="controls-panel">
            {/* Keyword input */}
            <div className="pf-keyword-wrap">
              <span className="control-label">KEYWORD</span>
              <input
                type="text"
                className="pf-keyword-input"
                value={keyword}
                onChange={e => setKeyword(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                placeholder="KEYWORD"
                maxLength={25}
                spellCheck={false}
              />
              <span className="char-count" style={{ textAlign: 'right' }}>
                {keyword.length}/25
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
                key: <strong style={{ color: '#ff00aa' }}>{keyword || '—'}</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── Visualization ────────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--magenta">5×5 KEY MATRIX</span>
          </div>

          <div className="pf-viz-layout">
            {/* Matrix */}
            <KeyMatrix matrix={matrix} highlightA={highlightA} highlightB={highlightB} />

            {/* Step browser */}
            {steps.length > 0 && (
              <div className="pf-step-panel">
                <div className="pf-step-nav">
                  <button
                    className="pf-nav-btn"
                    onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                    disabled={activeStep === 0}
                  >←</button>
                  <span className="pf-step-counter">
                    DIGRAPH <strong>{activeStep + 1}</strong> / {steps.length}
                  </span>
                  <button
                    className="pf-nav-btn"
                    onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
                    disabled={activeStep === steps.length - 1}
                  >→</button>
                </div>

                {currentStep && (
                  <div className="pf-step-detail">
                    <div className="pf-digraph-row">
                      <div className="pf-digraph-box pf-dg-a">{currentStep.a}{currentStep.b}</div>
                      <span className="pf-arrow">→</span>
                      <div className="pf-digraph-box pf-dg-out">{currentStep.outA}{currentStep.outB}</div>
                    </div>
                    <div className="pf-rule-badge">
                      {RULE_LABELS[currentStep.rule]}
                    </div>
                  </div>
                )}

                {/* All digraphs at a glance */}
                <div className="pf-all-digraphs">
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      className={`pf-dg-chip ${i === activeStep ? 'pf-dg-chip-active' : ''}`}
                      onClick={() => setActiveStep(i)}
                      style={i === activeStep ? { borderColor: '#ff00aa', color: '#ff00aa' } : {}}
                    >
                      {s.a}{s.b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {steps.length === 0 && (
              <div className="rg-empty" style={{ flex: 1 }}>
                ENTER TEXT AND KEYWORD TO SEE DIGRAPH STEPS
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
