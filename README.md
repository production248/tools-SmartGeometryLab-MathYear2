# Smart Geometry Lab - Math Year 2

Independent Math Year 2 edition generated from the shared Smart Geometry Lab source.

- Fixed curriculum level: Math Year 2
- Activities: limited to the existing textbook-aligned Year 2 geometry plan
- Languages: Bahasa Melayu, Chinese, and English
- Input: mouse, touch, and keyboard friendly
- Teacher controls: retained from the existing year-specific tools
- Whiteboard layout: large classroom typography with the compact brand title retained
- Shared components: current-activity operation guide and completion celebration

The year selector is intentionally hidden. Year 2 activities are exposed directly as three large
tabs: Shape Explorer, Net Folder, and Shape Drawing Board. The previous side control card and
duplicate three-step strips were removed so the geometry stage can use the full classroom width.
Inactive activity tabs and answer cards give one short nudge every 6.2 seconds, then stay still;
the animation is disabled when the device requests reduced motion.

## Entry points

- `index.html` is the production EdCloud-authorized entry point.
- `index-preview.html` is a developer-only preview that intentionally bypasses authorization.

For local testing, run `npm run preview` in this folder, then open
`http://127.0.0.1:8765/index-preview.html` in a browser. The preview server binds only to this
computer and does not expose the tool to the network.

Do not publish `index-preview.html` as the public learning-resource entry point.

Clicking the bottom-right mascot opens five steps for the currently selected activity only. A
normal activity click changes the activity without opening the guide. The activity remains locked
while the guide is open. Narration lives under
`assets/operation-guide/voices/{bm|zh|en}/contextual/`.

## EdCloud authentication

The learning interface starts only after the EdCloud Tool protocol v1 handshake succeeds.
`auth-bootstrap.js` accepts the trusted EdCloud web launchers and the opaque parent used by the
native StudentApp wrapper, validates the short-lived Tools token through the same-origin
`/api/auth/me` endpoint, and then loads `app.js`.

The token remains in memory only. Do not add it to URLs, browser storage, logs, analytics, or
error messages. Any future protected request should use `createToolsAuthorizationHeader()` from
`edcloud-tool-auth.js` and a server endpoint protected by the EdCloud Tools authorization policy.

Direct navigation to `index.html` is intentionally denied. Use `index-preview.html` for local
visual checks, or use an EdCloud-compatible launcher on the same `localhost` origin with a reverse
proxy for `/api/auth/me` to test the production entry.

Run `npm test` to validate all three activities, five guide steps per activity, 45 narration files,
desktop classroom type, the 390×844 mobile layout, reduced motion, authorization entry points, and
the shared completion celebration.

Shape Explorer keeps the face/edge/vertex controls available inside shape full-screen. Property
highlights appear one at a time, with edges drawn as individual strokes; each curved rim on a
cylinder or cone is treated as one mathematical edge. Dragging to rotate the shape preserves the
ongoing face, edge, or vertex sequence. Net Folder plays a paper sound when a fold
step changes. All interaction sounds respect the app's sound toggle.

The interaction samples in `assets/sfx/` are CC0 recordings from Freesound:

- `crayon-stroke.mp3`: [KaterinaGalasova, "15GGalasovaK_crayon.wav"](https://freesound.org/people/KaterinaGalasova/sounds/461928/)
- `quiet-page-turn.mp3`: [SpaceJoe, "Quiet Page Turn - 6"](https://freesound.org/people/SpaceJoe/sounds/484966/)

Run `node scripts/feature-sequence-test.mjs` for a focused browser test of the full-screen
controls, sequential feature animation, logical curved-edge counts, and sound playback. The
broader `npm test` suite additionally needs the sibling EdCloud shared-components package.
