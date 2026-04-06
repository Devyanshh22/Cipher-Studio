import React, { useState, useEffect, useRef, useMemo } from 'react';
import { encrypt, decrypt, getShiftTable } from '../utils/vigenere';
import './VigenereUI.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const ALPHA       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const RAIL_COLORS = [
  '#00f5ff', '#ff00aa', '#aaff00', '#ff6600',
  '#cc00ff', '#ffff00', '#ff3333', '#00ff88',
];
const VIOLET      = '#9d00ff';
const MAX_PREVIEW = 24;

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

// ─── KeyPreview ───────────────────────────────────────────────────────────────
function KeyPreview({ cleanText, keyword }) {
  if (!cleanText || !keyword) return null;
  const cleanKey  = keyword.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey.length) return null;

  const chars = cleanText.slice(0, MAX_PREVIEW).split('');
  const more  = cleanText.length > MAX_PREVIEW;

  return (
    <div className="vig-preview">
      <div className="vig-preview-row">
        <span className="vig-preview-label">MSG</span>
        {chars.map((ch, i) => (
          <div key={i} className="vig-preview-cell vig-preview-msg">{ch}</div>
        ))}
        {more && <span className="vig-preview-more">+{cleanText.length - MAX_PREVIEW}</span>}
      </div>
      <div className="vig-preview-row">
        <span className="vig-preview-label">KEY</span>
        {chars.map((_, i) => (
          <div key={i} className="vig-preview-cell vig-preview-key">
            {cleanKey[i % cleanKey.length]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FormulaBanner ────────────────────────────────────────────────────────────
function FormulaBanner({ mode, firstStep }) {
  const formula = mode === 'encrypt'
    ? 'C = (P + K) mod 26'
    : 'P = (C − K + 26) mod 26';

  let example = null;
  if (firstStep) {
    const { plain, keyChar, shift, cipher } = firstStep;
    const pVal = plain.charCodeAt(0) - 65;
    const kVal = shift;
    const cVal = cipher.charCodeAt(0) - 65;
    if (mode === 'encrypt') {
      example = `${plain}(${pVal}) + ${keyChar}(${kVal}) = ${cipher}(${cVal})`;
    } else {
      example = `${plain}(${pVal}) − ${keyChar}(${kVal}) + 26 = ${cipher}(${cVal < 0 ? cVal + 26 : cVal})`;
    }
  }

  return (
    <div className="vig-formula-banner">
      <span className="vig-formula-eq">{formula}</span>
      {example && (
        <span className="vig-formula-example">{example}</span>
      )}
    </div>
  );
}

// ─── Vigenère Tableau ─────────────────────────────────────────────────────────
function VigTableau({ activeRow, activeCol }) {
  // Memoize the static cell letters — they never change
  const cells = useMemo(() =>
    ALPHA.map((_, r) =>
      ALPHA.map((_, c) => ALPHA[(r + c) % 26])
    )
  , []);

  return (
    <div className="vig-tableau-scroll">
      <div className="vig-tableau">
        {/* Corner */}
        <div className="vig-th vig-th-corner" />
        {/* Column headers — plain letters */}
        {ALPHA.map((ch, c) => (
          <div
            key={c}
            className={`vig-th vig-th-col${c === activeCol ? ' vig-th-active-col' : ''}`}
          >
            {ch}
          </div>
        ))}

        {/* Rows */}
        {cells.map((row, r) => (
          <React.Fragment key={r}>
            {/* Row header — key letter */}
            <div className={`vig-th vig-th-row${r === activeRow ? ' vig-th-active-row' : ''}`}>
              {ALPHA[r]}
            </div>
            {/* Cells */}
            {row.map((letter, c) => {
              const isIntersect = r === activeRow && c === activeCol;
              const isRowHi     = r === activeRow && !isIntersect;
              const isColHi     = c === activeCol && !isIntersect;
              return (
                <div
                  key={c}
                  className={`vig-cell${isIntersect ? ' vig-intersect' : isRowHi ? ' vig-row-hi' : isColHi ? ' vig-col-hi' : ''}`}
                >
                  {letter}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── ShiftTable ───────────────────────────────────────────────────────────────
function ShiftTable({ steps, activeIdx }) {
  if (!steps.length) {
    return (
      <div className="rg-empty" style={{ minHeight: 80 }}>
        ENTER TEXT AND KEYWORD TO SEE SHIFT BREAKDOWN
      </div>
    );
  }

  return (
    <div className="vig-shift-scroll">
      <table className="vig-shift-table">
        <thead>
          <tr>
            <th>#</th>
            <th>PLAIN</th>
            <th>KEY</th>
            <th>SHIFT</th>
            <th>CIPHER</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => {
            const color   = RAIL_COLORS[i % RAIL_COLORS.length];
            const isActive = i === activeIdx;
            return (
              <tr
                key={i}
                className={`vig-shift-row${isActive ? ' vig-shift-active' : ''}`}
                style={isActive ? { borderColor: VIOLET } : {}}
              >
                <td className="vig-td-idx" style={{ color: color + '66' }}>{s.pos + 1}</td>
                <td>
                  <span className="vig-char-badge" style={{ color, borderColor: color + '44', background: color + '12' }}>
                    {s.plain}
                  </span>
                </td>
                <td>
                  <span className="vig-char-badge" style={{ color: VIOLET + 'ee', borderColor: VIOLET + '44', background: VIOLET + '12' }}>
                    {s.keyChar}
                  </span>
                </td>
                <td className="vig-td-shift" style={{ color: `${color}99` }}>
                  +{s.shift}
                </td>
                <td>
                  <span className="vig-char-badge" style={{ color: '#aaff00', borderColor: '#aaff0044', background: '#aaff0012' }}>
                    {s.cipher}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── VigenereUI ───────────────────────────────────────────────────────────────
export default function VigenereUI({ onBack }) {
  const [inputText,  setInputText]  = useState('ATTACKATDAWN');
  const [keyword,    setKeyword]    = useState('LEMON');
  const [mode,       setMode]       = useState('encrypt');
  const [outputText, setOutputText] = useState('');
  const [steps,      setSteps]      = useState([]);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [glitching,  setGlitching]  = useState(false);
  const [infoOpen,   setInfoOpen]   = useState(false);

  const cycleRef  = useRef(null);
  const glitchRef = useRef(null);

  const cleanInput = useMemo(
    () => inputText.toUpperCase().replace(/[^A-Z]/g, ''),
    [inputText]
  );
  const cleanKey = useMemo(
    () => keyword.toUpperCase().replace(/[^A-Z]/g, ''),
    [keyword]
  );

  // ── Compute output + steps ──────────────────────────────────────────────────
  useEffect(() => {
    if (!cleanInput || !cleanKey) {
      setOutputText('');
      setSteps([]);
      return;
    }
    const out = mode === 'encrypt'
      ? encrypt(inputText, keyword)
      : decrypt(inputText, keyword);
    setOutputText(out);
    setSteps(getShiftTable(inputText, keyword, mode));
    setActiveIdx(0);
  }, [inputText, keyword, mode, cleanInput, cleanKey]);

  // ── Glitch on output change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!outputText) return;
    if (glitchRef.current) clearTimeout(glitchRef.current);
    setGlitching(true);
    glitchRef.current = setTimeout(() => setGlitching(false), 350);
    return () => { if (glitchRef.current) clearTimeout(glitchRef.current); };
  }, [outputText]);

  // ── Auto-cycle through characters ──────────────────────────────────────────
  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (!steps.length) { setActiveIdx(0); return; }
    cycleRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % steps.length);
    }, 650);
    return () => clearInterval(cycleRef.current);
  }, [steps]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (cycleRef.current)  clearInterval(cycleRef.current);
      if (glitchRef.current) clearTimeout(glitchRef.current);
    };
  }, []);

  // Active row/col for tableau
  const activeStep = steps[activeIdx] || null;
  const tableauRow = activeStep ? activeStep.keyChar.charCodeAt(0) - 65 : -1;
  const tableauCol = activeStep ? activeStep.plain.charCodeAt(0) - 65 : -1;

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
            <div className="header-badge">VIGENÈRE CIPHER</div>
            <button
              className={`info-btn vig-info-btn ${infoOpen ? 'info-btn-active vig-info-btn-active' : ''}`}
              onClick={() => setInfoOpen(o => !o)}
              aria-label="About this cipher"
            >?</button>
          </div>

          <h1 className="title">
            <span className="title-vigenere">CIPHER</span>{' '}
            <span className="title-studio">STUDIO</span>
          </h1>
          <p className="subtitle">polyalphabetic keyword substitution cipher</p>

          {infoOpen && (
            <div className="info-panel vig-info-panel">
              <div className="info-section">
                <h3 className="info-heading vig-heading">What is the Vigenère Cipher?</h3>
                <p className="info-body">
                  A <strong>polyalphabetic substitution cipher</strong> that uses a keyword to
                  apply a different Caesar shift to each letter. Each character in the plaintext
                  is shifted by the alphabetical value of the corresponding keyword character,
                  cycling the keyword as needed.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading vig-heading">Historical Use</h3>
                <p className="info-body">
                  Described by Giovan Battista Bellaso in 1553 and later misattributed to
                  Blaise de Vigenère. It was called <strong>"le chiffre indéchiffrable"</strong>
                  (the indecipherable cipher) for three centuries, until Charles Babbage broke
                  it in the 1850s using the Kasiski examination.
                </p>
              </div>
              <div className="info-section">
                <h3 className="info-heading vig-heading">Main Weakness</h3>
                <p className="info-body">
                  Security depends entirely on keyword length and randomness. A short or repeated
                  keyword reduces it to multiple Caesar ciphers — crackable via{' '}
                  <strong>index of coincidence</strong> analysis or the Kasiski test.
                  A fully random key of message length is the One-Time Pad.
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ── Controls row ────────────────────────────────────────────────── */}
        <section className="controls-row">
          <div className="input-wrap">
            <label className="panel-label" htmlFor="vig-input">
              {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
            </label>
            <textarea
              id="vig-input"
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
            {/* Key alignment preview */}
            <KeyPreview cleanText={cleanInput} keyword={keyword} />
          </div>

          <div className="controls-panel">
            <div className="pf-keyword-wrap">
              <span className="control-label">KEYWORD</span>
              <input
                type="text"
                className="vig-keyword-input"
                value={keyword}
                onChange={e => setKeyword(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                placeholder="KEYWORD"
                maxLength={26}
                spellCheck={false}
              />
              <span className="char-count" style={{ textAlign: 'right' }}>
                {cleanKey.length} chars
              </span>
            </div>
            <div className="divider" />
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

        {/* ── Formula banner ───────────────────────────────────────────────── */}
        <FormulaBanner mode={mode} firstStep={steps[activeIdx] || null} />

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
              <span>{cleanInput.length} → {outputText.length} chars</span>
              <span className="output-key-note">
                key: <strong style={{ color: VIOLET }}>{keyword || '—'}</strong>
              </span>
            </div>
          )}
        </section>

        {/* ── Tableau ──────────────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--violet">VIGENÈRE TABLEAU</span>
            {activeStep && (
              <div className="vig-tableau-nav">
                <button
                  className="pf-nav-btn vig-nav-btn"
                  onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                  disabled={activeIdx === 0}
                >←</button>
                <span className="pf-step-counter">
                  CHAR <strong style={{ color: VIOLET }}>{activeIdx + 1}</strong> / {steps.length}
                </span>
                <button
                  className="pf-nav-btn vig-nav-btn"
                  onClick={() => setActiveIdx(i => Math.min(steps.length - 1, i + 1))}
                  disabled={activeIdx === steps.length - 1}
                >→</button>
              </div>
            )}
          </div>

          {!cleanInput && (
            <div className="rg-empty">ENTER TEXT AND KEYWORD TO SEE THE TABLEAU</div>
          )}
          {cleanInput && (
            <VigTableau activeRow={tableauRow} activeCol={tableauCol} />
          )}
        </section>

        {/* ── Shift Breakdown ──────────────────────────────────────────────── */}
        <section className="viz-section">
          <div className="viz-section-header">
            <span className="panel-label panel-label--violet">SHIFT BREAKDOWN</span>
          </div>
          <ShiftTable steps={steps} activeIdx={activeIdx} />
        </section>

      </div>
    </div>
  );
}
