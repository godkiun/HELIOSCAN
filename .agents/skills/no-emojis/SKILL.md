---
name: no-emojis
description: Strict design rule enforcing the total prohibition of raw Unicode emojis in code, UI text, buttons, labels, and components. Requires using drawn SVG icons, Lucide icons, Feather icons, or real vector icon libraries instead.
version: 1.0.0
---

# No Emojis — Icons Only Skill

This skill enforces a mandatory design standard across all web applications, user interfaces, components, and documentation: **never use raw Unicode emojis in production code or user interfaces**.

Raw Unicode emojis (e.g., ☀️, 🗺️, ⚡, 🔍, 📋, 💰, 🏠, 📁, 📐, 📷, 🧭, 💬, 🚀, 💡, 📍) render inconsistently across operating systems, browsers, and devices, creating an unpolished, amateur, or inconsistent appearance.

---

## 🚫 Mandatory Bans

- **NO Emojis in HTML/JSX/TSX text:** Do not place raw Unicode emojis in headings, paragraph text, button labels, dropdown options, table cells, or badges.
- **NO Emojis in CSS content:** Do not use emojis in `content: "☀️"` or pseudoelements.
- **NO Emojis in UI copy or notification toasts:** Replace all emoji prefixes with clean SVG icons or text-only badges.

---

## 🛠️ Required Substitutions & Standards

1. **Use Inline SVGs or Icon Libraries:**
   - Draw clean inline `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">` icons.
   - Use Lucide Icons, Feather Icons, Heroicons, or Material Symbols.
   - Ensure uniform stroke width (e.g., `stroke-width="2"` or `1.75`), consistent sizing (`16px`, `20px`, `24px`), and theme-aligned colors (`currentColor`).

2. **Automated Replacement Guide:**

| Emoji Category | Banned Emoji Examples | Approved Replacement Pattern |
|---|---|---|
| Search / Scan | 🔍, 🔎 | `<svg class="icon">` (Magnifying glass SVG) |
| Solar / Energy | ☀️, ⚡, 💡 | `<svg class="icon">` (Sun / Lightning bolt / Bulb SVG) |
| Maps / Location | 🗺️, 📍, 🧭 | `<svg class="icon">` (Map / Map-pin / Compass SVG) |
| Financial / ROI | 💰, 💵, 💳 | `<svg class="icon">` (Wallet / Dollar-sign / Coins SVG) |
| File / Document | 📋, 📁, 📄 | `<svg class="icon">` (Clipboard / Folder / File-text SVG) |
| Home / Building | 🏠, 🏢, 📐 | `<svg class="icon">` (Home / Building / Ruler SVG) |
| Environmental | 🌱, 🍃, 🌳 | `<svg class="icon">` (Leaf / Tree SVG) |

3. **Styling SVG Icons:**
   - Always wrap icons in container spans or use CSS utilities: `.icon-svg { width: 1.25em; height: 1.25em; vertical-align: -0.125em; flex-shrink: 0; }`.
   - Ensure icons scale smoothly with font size and inherit text color (`stroke: currentColor` or `fill: currentColor`).

---

## 🔍 Verification Protocol

Before completing any frontend or UI task, run a search for raw Unicode emoji characters in modified UI files:
```bash
grep -E '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' <modified_files>
```
If any emoji is found in HTML, JSX, TSX, JS, TS, or CSS files, replace it immediately with a drawn SVG vector icon.
