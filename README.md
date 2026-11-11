# robin lab — the corridor

A one-page site: a dark low-poly corridor you walk by scrolling. The paintings
hang on the walls; the one you are walking past floats out to the middle and
shows itself — a slow 3D carousel. Each painting is a service I can be hired for.

- No libraries, no build step. Three files: `index.html`, `styles.css`, `app.js`.
- The scene is a tiny 3D renderer in canvas 2D: polygons, painter sort, fog.
  One canvas means Safari, Chrome and Firefox paint the same thing.
- The paintings are plain DOM (real text, real links, focusable with tab).
  Scroll moves the camera, click a painting and it lifts off the wall.
- Deep links: `#websites`, `#ai`, ... or `#4`.

Serve it with anything: `python3 -m http.server`.
