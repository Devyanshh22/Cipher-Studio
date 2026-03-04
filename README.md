# Cipher Studio - An educational platform to learn Encrytpion Algorhithms visually!

An interactive browser-based simulator for classical cryptographic ciphers — built to make the inner workings of encryption visible, not just functional.

**Live demo → [devyanshh22.github.io/Cipher-Studio](https://devyanshh22.github.io/Cipher-Studio)**

---

## What is this?

Most explanations of classical ciphers are either too abstract or too academic. Cipher Studio bridges that gap by letting you type a message, pick a cipher, and *watch* the encryption happen — character by character, step by step.

It's not a security tool. It's a learning tool.

---

## Ciphers

### Rail Fence
A transposition cipher that writes your message in a zigzag pattern across a number of "rails", then reads each rail left to right to produce the ciphertext. The key is simply the number of rails (2–8).

- Animated zigzag grid visualization
- Per-rail character breakdown
- Step-by-step explainer

### Playfair
A digraph substitution cipher that encrypts pairs of letters using a 5×5 matrix built from a keyword. Each pair is transformed by one of three geometric rules depending on where the two characters fall in the matrix.

- Interactive 5×5 key matrix with live cell highlighting
- Digraph-by-digraph step browser
- Rule badge (same row / same column / rectangle)

### One-Time Pad
An XOR cipher where every character is combined with a matching key character. When the key is truly random and never reused, it is mathematically proven to be unbreakable.

- Random key generator
- Hex ciphertext output
- Per-character XOR table: `CHAR ⊕ KEY = HEX`

---

## How it's built

| Layer | Choice |
|---|---|
| Framework | React (TypeScript, Create React App) |
| Styling | Plain CSS with custom properties — no UI library |
| Cipher logic | Pure JavaScript — no external crypto dependencies |
| Fonts | JetBrains Mono |
| Deployment | GitHub Pages via `gh-pages` |

All three cipher algorithms are implemented from scratch in `src/utils/` and are fully decoupled from the UI. The visualization components read from the same algorithm functions, so what you see is always exactly what the cipher is doing.

---

## Running locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
  utils/
    railFence.js     — Rail Fence encrypt / decrypt / pattern
    playfair.js      — Playfair matrix, digraph rules, step data
    otp.js           — XOR encrypt / decrypt / key generator
  components/
    RailGrid.jsx     — Zigzag grid + legend + steps
    PlayfairUI.jsx   — Key matrix + digraph step browser
    OtpUI.jsx        — XOR table visualization
  App.tsx            — Cipher selector + Rail Fence UI
  App.css            — All shared styles
```

---

## Deploy

```bash
npm run deploy
```

Builds and publishes to the `gh-pages` branch automatically.
