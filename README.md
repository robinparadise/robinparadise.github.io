# robin giles — zero slop core

A one-page portfolio that behaves like an instrument: a wireframe field you fly
through while you scroll, kinetic type, live telemetry, real content.

- No libraries, no build step, no web fonts. Three files: `index.html`, `styles.css`, `app.js`.
- The field is a 3D point grid projected to canvas 2D (one canvas, so every browser paints it the same).
- Content is plain semantic HTML: real headings, real links, `<details>` rows that open without JS.
- Keyboard: `0`–`4` jump to a section, `c` copies the mail.
- Respects `prefers-reduced-motion` (static field, no wipe, no magnetic type) and pauses when the tab is hidden.

Serve it with anything: `python3 -m http.server`.
