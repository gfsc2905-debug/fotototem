# AI Rules for Fotototem

This document explains how this app is built and how an AI assistant should extend or modify it.

---

## Tech Stack (5–10 key points)

- **Build tooling**: Vite + TypeScript + React (SPA mounted at `#root` via `index.tsx`).
- **Rendering**: Client-side React with functional components and hooks only (no class components).
- **Styling**: Tailwind CSS loaded via CDN in `index.html`, with custom `globo` theme extensions (colors, radii, gradients, fonts).
- **Routing**: Currently a single-page app with `App.tsx` as the main entry UI; no React Router in this codebase.
- **Types & state**: Shared types live in `types.ts` (e.g., `CameraDevice`, `AppState`, `PhotoData`); app state is managed via React `useState` and `useEffect`.
- **Media & capture**: Browser APIs (`navigator.mediaDevices`, `getUserMedia`, canvas) are used for camera access and image capture with a 4:5 aspect-ratio composition.
- **QR & sharing**: `react-qr-code` is used to generate QR codes for public image URLs; `fetch` is used directly for calling the ImgBB upload API.
- **Icons**: `lucide-react` is the only icon library and is already used throughout (`Camera`, `SwitchCamera`, `Download`, etc.).
- **Build config**: `vite.config.ts` defines import aliases (notably `@`) and some `process.env` defines for Gemini-related keys (currently unused in the app UI).

---

## General Coding Rules

- **Language & style**
  - Use **TypeScript** for all React code.
  - Prefer **functional components with hooks**; do not introduce class components.
  - Keep files **small and focused**; create new components in `components/` instead of bloating existing ones.
  - Use **descriptive prop and state names** and keep types in `types.ts` when they are reused by multiple files.

- **Project layout**
  - Root UI entry is `App.tsx`; keep the main layout and high-level state there.
  - Components live in `components/` and must be imported into `App.tsx` (or other components) to appear in the UI.
  - Shared types must go into `types.ts` when logically reusable.

- **State & side effects**
  - Use `useState`, `useEffect`, and `useRef` as in existing files.
  - Avoid complex global state solutions or new state libraries unless explicitly requested by the user.
  - Do not add try/catch just for logging; allow errors to surface unless the user explicitly asks for custom error handling.

- **Accessibility & UX**
  - Keep buttons as `<button>` elements with clear labels and icons from `lucide-react`.
  - Maintain consistent “Globo” visual style (rounded mosaic frames, gradients, pill buttons, etc.).
  - Animations should be done with Tailwind utility classes (e.g., `animate-in`, `fade-in`) if already used.

---

## Library Usage Rules

### 1. React & React DOM

- **Use for**:
  - UI components.
  - React hooks (`useState`, `useEffect`, `useRef`, `useCallback`).
- **Do not**:
  - Introduce other UI frameworks (Vue, Svelte, etc.).
  - Use deprecated lifecycle methods or class components.

### 2. TypeScript

- **Use for**:
  - All `.tsx` and `.ts` files.
  - Defining props, state, and shared types (`types.ts`).
- **Conventions**:
  - Prefer explicit interfaces and types for props (`interface ComponentProps { ... }`).
  - Reuse or extend existing types rather than duplicating shapes.

### 3. Tailwind CSS

- **Use for**:
  - **All styling**: layout, spacing, typography, color, borders, responsive behavior.
  - Reusing existing custom theme tokens (e.g., `bg-globo-blue`, `rounded-mosaic`, `bg-globo-gradient`).
- **Do not**:
  - Add new CSS files or inline `<style>` blocks (beyond what already exists in `index.html`).
  - Introduce other styling systems (CSS Modules, styled-components, etc.) unless the user explicitly requests them.

### 4. Icons (`lucide-react`)

- **Use for**:
  - All icons in the UI (camera, download, error, etc.).
- **Conventions**:
  - Import only the icons needed from `lucide-react`.
  - Keep icon size and usage consistent with existing components, e.g.:
    - `import { Camera, Download } from 'lucide-react';`
- **Do not**:
  - Introduce other icon packs or SVG libraries.

### 5. QR Codes (`react-qr-code`)

- **Use for**:
  - Generating QR codes from URLs, as is done in `ResultScreen.tsx`.
- **Conventions**:
  - Keep usage simple: `<QRCode value={url} size={...} level="L" />`.
  - Customize appearance via props only (no additional QR libraries).

### 6. HTTP & APIs

- **Use for**:
  - Network calls with the **built-in `fetch` API** (as in the ImgBB upload).
- **Conventions**:
  - Use `async/await` syntax.
  - Parse JSON via `response.json()` and check for success flags as in existing code.
- **Do not**:
  - Add HTTP client libraries like Axios unless explicitly requested.

### 7. Media & Canvas APIs

- **Use for**:
  - Camera access (`navigator.mediaDevices.getUserMedia`, `enumerateDevices`).
  - Drawing and exporting photos via `<canvas>` as shown in `CameraFeed.tsx`.
- **Conventions**:
  - Maintain the 4:5 aspect ratio and mirroring behavior used for selfies.
  - Keep all camera logic centralized in camera-related components; do not duplicate it elsewhere.

### 8. Environment & Config

- **Use for**:
  - Environment variables managed through Vite (`loadEnv` in `vite.config.ts`).
- **Conventions**:
  - If new environment-based features are added, expose them with `define` in `vite.config.ts` and read them via `import.meta.env` or existing `process.env` defines.
- **Do not**:
  - Introduce new config systems or build tools.

---

## When Adding New Features

- **Prefer reusing**:
  - Existing app patterns (hooks, Tailwind classes, icon usage).
  - Existing types from `types.ts`, extending them when needed.
- **Keep it simple**:
  - Implement the minimal functionality that satisfies the user’s request.
  - Avoid new dependencies unless they are clearly justified and requested.
- **Ensure visibility**:
  - New visual components must be rendered from `App.tsx` (or a child reachable from it) so they show up in the main experience.