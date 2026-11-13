# robin giles — zero slop core

A one-page portfolio that behaves like an instrument: a wireframe field you fly
through while you scroll, kinetic type, live telemetry, real content.

- No libraries, no build step, no web fonts. The page is `index.html`, `styles.css`, `app.js`.
- The field is a 3D point grid projected to canvas 2D (one canvas, so every browser paints it the same).
- Content is plain semantic HTML: real headings, real links, `<details>` rows that open without JS.
- Keyboard: `0`–`4` jump to a section, `c` copies the mail.
- Respects `prefers-reduced-motion` (static field, no wipe, no magnetic type) and pauses when the tab is hidden.

## languages

| folder | language | role |
| --- | --- | --- |
| `/` | english | source of truth, default fallback |
| `localized/en/` | english | mirror, generated |
| `localized/es/` | spanish | translated by hand |

`firebase.json` points `hosting.i18n.root` at `/localized`, so Firebase Hosting
picks the folder from the visitor's `Accept-Language` header. The `en`/`es`
links in the HUD set the `firebase-language-override` cookie and reload `/`.
On a host without i18n rewrites (GitHub Pages, `python3 -m http.server`) the
script falls back to the folder URL, so the switch still works.

```sh
node tools/i18n.mjs           # mirror the english pages into localized/en/ + verify es
node tools/i18n.mjs --check   # verify only
```

The check compares tag skeletons: if you add a section, a row or a paragraph to
`index.html`, the script fails until `localized/es/index.html` has the same
markup. Edit english at the root, translate in `localized/es/`, run the script.

## serving

```sh
python3 -m http.server        # anywhere
firebase deploy --only hosting # Firebase Hosting, needs a project: firebase use --add
```

Test a language without touching your browser settings:

```js
document.cookie = "firebase-language-override=es,en"; location.reload();
```
