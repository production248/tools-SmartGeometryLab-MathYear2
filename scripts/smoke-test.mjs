import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const toolRoot = resolve(here, "..");
const previewFile = resolve(toolRoot, "index-preview.html");
const productionFile = resolve(toolRoot, "index.html");
const contextualKeys = [
  "goal-shape-explorer", "shape-choose", "shape-move", "shape-properties", "shape-summary",
  "goal-net-builder", "net-choose", "net-compare", "net-fold", "net-check",
  "goal-shape-drawer", "drawer-draw", "drawer-close", "drawer-connect", "drawer-inspect"
];
const shapeIconIds = [
  "triangle", "square", "rectangle", "circle", "cube",
  "cuboid", "pyramid", "cylinder", "cone", "sphere"
];

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];
const chromePath = chromeCandidates.find(existsSync);
if (!chromePath) throw new Error("Chrome or Edge was not found.");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const productionHtml = readFileSync(productionFile, "utf8");
const previewHtml = readFileSync(previewFile, "utf8");
assert(productionHtml.includes('type="module" src="auth-bootstrap.js"'), "Production entry does not load authorization.");
assert(!productionHtml.includes('<script src="app.js"'), "Production entry bypasses authorization by loading app.js directly.");
assert(previewHtml.includes('src="shared-components-loader.js"') && previewHtml.includes('src="app.js"'), "Preview does not load the app directly.");
assert(!previewHtml.includes('id="authGate"'), "Preview unexpectedly contains the authorization gate.");

for (const id of shapeIconIds) {
  const path = resolve(toolRoot, "assets", "shape-icons", `${id}.png`);
  assert(existsSync(path) && statSync(path).size > 2048, `Missing crayon shape icon: ${id}.png`);
  const probe = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height,pix_fmt", "-of", "json", path
  ], { encoding: "utf8", windowsHide: true });
  assert(probe.status === 0, `Invalid crayon shape icon: ${id}.png`);
  const stream = JSON.parse(probe.stdout).streams?.[0];
  assert(stream?.codec_name === "png" && stream.width === 256 && stream.height === 256 && stream.pix_fmt === "rgba", `Crayon shape icon must be a 256x256 transparent PNG: ${id}.png (${probe.stdout.trim()})`);
}

for (const language of ["bm", "zh", "en"]) {
  for (const key of contextualKeys) {
    const path = resolve(toolRoot, "assets", "operation-guide", "voices", language, "contextual", `${key}.mp3`);
    assert(existsSync(path) && statSync(path).size > 1024, `Missing narration: ${language}/${key}.mp3`);
    const probe = spawnSync("ffprobe", [
      "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1:nokey=1", path
    ], { encoding: "utf8", windowsHide: true });
    assert(probe.status === 0 && probe.stdout.trim() === "mp3", `Invalid narration: ${language}/${key}.mp3`);
  }
}

const port = 9450 + Math.floor(Math.random() * 300);
const profile = mkdtempSync(join(tmpdir(), "edcloud-geometry-smoke-"));
const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--allow-file-access-from-files",
  "--autoplay-policy=no-user-gesture-required",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1440,900",
  pathToFileURL(previewFile).href
], { stdio: "ignore", windowsHide: true });

const delay = milliseconds => new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds));

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
      const page = pages.find(candidate => candidate.type === "page" && candidate.url.startsWith("file:"));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {
      // Browser is starting.
    }
    await delay(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

const socket = new WebSocket(await waitForEndpoint());
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let nextId = 1;
const pending = new Map();
const browserErrors = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const pendingCall = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) pendingCall.reject(new Error(message.error.message));
    else pendingCall.resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails?.text || "Runtime exception");
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") browserErrors.push(message.params.entry.text);
});

function call(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCall, rejectCall) => pending.set(id, { resolve: resolveCall, reject: rejectCall }));
}

async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Evaluation failed");
  return result.result.value;
}

async function waitFor(expression, message, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(message);
}

try {
  await call("Runtime.enable");
  await call("Page.enable");
  await call("Log.enable");
  await waitFor(
    `Boolean(document.querySelector('#activityTitle')?.textContent && document.querySelector('edcloud-operation-guide')?.shadowRoot?.querySelector('.guide-root[data-ready="true"]'))`,
    "Geometry tool or shared guide did not initialize."
  );

  const desktop = await evaluate(`(() => {
    const font = selector => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return {
      tabs: [...document.querySelectorAll('.activity-tab')].map(button => button.dataset.activity),
      brandTitle: font('.brand h1'),
      brandSubtitle: font('.brand p'),
      activityTab: font('.activity-tab'),
      challenge: font('.challenge-text'),
      feedback: font('.feedback'),
      inactiveTabAnimation: getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationName,
      inactiveTabDuration: Number.parseFloat(getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationDuration),
      activeTabAnimation: getComputedStyle(document.querySelector('.activity-tab.active')).animationName,
      inactiveChoiceAnimation: getComputedStyle(document.querySelector('.choice-chip:not(.active)')).animationName,
      shapeSummaryHidden: document.querySelector('#liveSummary').hidden,
      shapeFullscreenLabel: document.querySelector('#shapeFullscreenToggle').textContent.trim(),
      shapeFullscreenPressed: document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed'),
      shapeFullscreenButton: rect('#shapeFullscreenToggle'),
      explanationFont: font('.property-explanation'),
      explorer: rect('.shape-explorer'),
      shapeCanvas: rect('.shape-canvas'),
      propertyPanel: rect('.property-panel'),
      propertyExplanation: rect('.property-explanation'),
      shapeIcons: [...document.querySelectorAll('[data-shape] .shape-choice-icon')].map(icon => ({
        source: icon.getAttribute('src'),
        loaded: icon.complete && icon.naturalWidth === 256 && icon.naturalHeight === 256,
        width: Number.parseFloat(getComputedStyle(icon).width)
      })),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      sideCard: Boolean(document.querySelector('.control-card')),
      repeatedSteps: Boolean(document.querySelector('.steps')) || document.querySelector('#toolGuide')?.offsetParent !== null
    };
  })()`);
  assert(JSON.stringify(desktop.tabs) === JSON.stringify(["shapeExplorer", "netBuilder", "shapeDrawer"]), `Wrong Year 2 activities: ${JSON.stringify(desktop)}`);
  assert(desktop.brandTitle <= 41 && desktop.brandSubtitle === 14, `Brand copy was enlarged: ${JSON.stringify(desktop)}`);
  assert(desktop.activityTab >= 30 && desktop.challenge >= 52 && desktop.feedback >= 30, `Classroom copy is too small: ${JSON.stringify(desktop)}`);
  assert(desktop.inactiveTabAnimation === "choice-nudge" && desktop.inactiveTabDuration >= 6 && desktop.activeTabAnimation === "none" && desktop.inactiveChoiceAnimation === "choice-nudge", `Periodic choice nudges are not configured correctly: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeSummaryHidden, `The duplicate shape summary is still visible: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeFullscreenLabel.includes("Paparan bentuk penuh") && desktop.shapeFullscreenPressed === "false" && desktop.shapeFullscreenButton.left >= desktop.shapeCanvas.left && desktop.shapeFullscreenButton.right <= desktop.shapeCanvas.right, `The shape full-screen control is missing or misplaced: ${JSON.stringify(desktop)}`);
  assert(desktop.explanationFont >= 32 && desktop.propertyExplanation.left <= desktop.explorer.left + 1 && desktop.propertyExplanation.right >= desktop.explorer.right - 1 && desktop.propertyExplanation.top >= Math.max(desktop.shapeCanvas.bottom, desktop.propertyPanel.bottom) - 1, `The enlarged shape explanation is not a full-width row below the diagram: ${JSON.stringify(desktop)}`);
  assert(desktop.shapeIcons.length === 10 && desktop.shapeIcons.every((icon, index) => icon.source.endsWith(`assets/shape-icons/${shapeIconIds[index]}.png`) && icon.loaded && icon.width >= 54), `Desktop crayon shape icons are missing, broken, or too small: ${JSON.stringify(desktop.shapeIcons)}`);
  assert(!desktop.horizontalOverflow && !desktop.sideCard && !desktop.repeatedSteps, `Desktop layout regression: ${JSON.stringify(desktop)}`);

  await evaluate(`Object.defineProperty(document.querySelector('.shape-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The shape full-screen fallback did not open.");
  const expandedShape = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas');
    const button = document.querySelector('#shapeFullscreenToggle');
    return {
      canvas: canvas.getBoundingClientRect().toJSON(),
      viewport: { width: innerWidth, height: innerHeight },
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
      pressed: button.getAttribute('aria-pressed'),
      label: button.textContent.trim(),
      propertiesInsideCanvas: canvas.contains(document.querySelector('.property-panel')),
      explanationInsideCanvas: canvas.contains(document.querySelector('.property-explanation'))
    };
  })()`);
  assert(expandedShape.canvas.left === 0 && expandedShape.canvas.top === 0 && Math.abs(expandedShape.canvas.width - expandedShape.viewport.width) <= 1 && Math.abs(expandedShape.canvas.height - expandedShape.viewport.height) <= 1 && expandedShape.bodyLocked && expandedShape.pressed === "true" && expandedShape.label.includes("Keluar paparan bentuk") && !expandedShape.propertiesInsideCanvas && !expandedShape.explanationInsideCanvas, `The shape canvas alone does not cover the desktop viewport: ${JSON.stringify(expandedShape)}`);
  await evaluate(`document.querySelector('.solid-zoom-controls button:last-of-type').click()`);
  assert(await evaluate(`document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen') && document.querySelector('#shapeFullscreenToggle').getAttribute('aria-pressed') === 'true'`), "Shape full-screen state was lost after using a diagram control.");
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await waitFor(`!document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "Escape did not close the shape full-screen fallback.");
  await evaluate(`delete document.querySelector('.shape-canvas').requestFullscreen`);

  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  assert(await evaluate(`getComputedStyle(document.querySelector('.activity-tab:not(.active)')).animationName === 'none'`), "Reduced-motion mode did not disable choice nudges.");
  await call("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });

  const activities = [
    { id: "shapeExplorer", goal: "Kenali bentuk", firstKey: "goal-shape-explorer" },
    { id: "netBuilder", goal: "Fahami bentangan", firstKey: "goal-net-builder" },
    { id: "shapeDrawer", goal: "Bina bentuk 2D dan 3D", firstKey: "goal-shape-drawer" }
  ];
  for (const activity of activities) {
    await evaluate(`document.querySelector('.activity-tab[data-activity="${activity.id}"]').click()`);
    await waitFor(`document.querySelector('.activity-tab.active')?.dataset.activity === '${activity.id}'`, `${activity.id} did not activate.`);
    const closedState = await evaluate(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      return {
        hidden: guide.shadowRoot.querySelector('.guide-layer').hidden,
        ids: guide._config.steps.map(step => step.id),
        firstTarget: guide._config.steps[0].target,
        lastTarget: guide._config.steps.at(-1).target,
        summaryHidden: document.querySelector('#liveSummary').hidden
      };
    })()`);
    assert(closedState.hidden, `${activity.id} opened the guide automatically.`);
    assert(closedState.ids.length === 5 && closedState.ids.every(id => id.startsWith(`${activity.id}-`)), `${activity.id} guide is not activity-specific: ${JSON.stringify(closedState)}`);
    assert(closedState.firstTarget === `.activity-tab[data-activity="${activity.id}"]`, `${activity.id} goal target is wrong.`);
    if (activity.id === "shapeExplorer") {
      assert(closedState.lastTarget === "#visualStage .property-explanation" && closedState.summaryHidden, `Shape Explorer still targets the removed duplicate summary: ${JSON.stringify(closedState)}`);
    } else {
      assert(!closedState.summaryHidden, `${activity.id} did not restore its result summary.`);
    }

    await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
    await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, `${activity.id} guide did not open.`);
    const opened = await evaluate(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      const root = guide.shadowRoot;
      const card = root.querySelector('.guide-card').getBoundingClientRect();
      return {
        title: root.querySelector('#guide-title').textContent,
        count: root.querySelector('.step-count').textContent,
        narration: root.querySelector('.narration').src,
        titleSize: Number.parseFloat(getComputedStyle(root.querySelector('#guide-title')).fontSize),
        bodySize: Number.parseFloat(getComputedStyle(root.querySelector('.guide-body')).fontSize),
        card: card.toJSON()
      };
    })()`);
    assert(opened.title === activity.goal && opened.count.includes("1") && opened.count.includes("5"), `${activity.id} goal copy is wrong: ${JSON.stringify(opened)}`);
    assert(opened.narration.includes(`/bm/contextual/${activity.firstKey}.mp3`), `${activity.id} narration is wrong.`);
    assert(opened.titleSize >= 50 && opened.bodySize >= 38, `${activity.id} guide copy is too small.`);
    assert(opened.card.left >= 0 && opened.card.right <= 1440 && opened.card.top >= 0 && opened.card.bottom <= 900, `${activity.id} guide is outside the desktop viewport.`);

    const lockedActivity = activity.id === "shapeExplorer" ? "netBuilder" : "shapeExplorer";
    await evaluate(`document.querySelector('.activity-tab[data-activity="${lockedActivity}"]').click()`);
    assert(await evaluate(`document.querySelector('.activity-tab.active').dataset.activity === '${activity.id}'`), `${activity.id} changed while its guide was open.`);
    await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);
    await waitFor(`(() => {
      const guide = document.querySelector('edcloud-operation-guide');
      return guide.shadowRoot.querySelector('.guide-layer').hidden && !guide._closing && !guide._moving;
    })()`, `${activity.id} guide did not finish closing.`);
  }

  await evaluate(`document.querySelector('.activity-tab[data-activity="netBuilder"]').click()`);
  await waitFor(`document.querySelector('.activity-tab.active')?.dataset.activity === 'netBuilder'`, "Net builder did not activate for the celebration test.");
  assert(await evaluate(`[...document.querySelectorAll('[data-net-shape] .shape-choice-icon')].length === 4 && [...document.querySelectorAll('[data-net-shape] .shape-choice-icon')].every(icon => icon.complete && icon.naturalWidth === 256)`), "Net Builder does not use the crayon solid icons.");
  await evaluate(`(() => {
    for (let index = 0; index < 20; index += 1) {
      const next = document.querySelector('#nextFold');
      if (!next || next.disabled) break;
      next.click();
    }
  })()`);
  await waitFor(`document.querySelector('edcloud-correct-celebration')?.shadowRoot.querySelector('.cc-dialog')?.open`, "Completion celebration did not open.");
  const celebration = await evaluate(`(() => {
    const root = document.querySelector('edcloud-correct-celebration').shadowRoot;
    return {
      title: root.querySelector('.cc-title').textContent,
      answer: root.querySelector('.cc-answer-text').textContent,
      dialog: root.querySelector('.cc-dialog').getBoundingClientRect().toJSON()
    };
  })()`);
  assert(celebration.title === "Hebat!" && celebration.answer.length > 0, `Completion celebration copy is wrong: ${JSON.stringify(celebration)}`);
  assert(celebration.dialog.left >= 0 && celebration.dialog.right <= 1440 && celebration.dialog.top >= 0 && celebration.dialog.bottom <= 900, `Completion celebration is outside the desktop viewport: ${JSON.stringify(celebration)}`);
  await evaluate(`window.EdCloudCorrectCelebration.close('smoke-test')`);
  await waitFor(`!document.querySelector('edcloud-correct-celebration').shadowRoot.querySelector('.cc-dialog').open`, "Completion celebration did not close.");

  await evaluate(`document.querySelector('.activity-tab[data-activity="shapeExplorer"]').click(); document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
  await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, "Guide did not reopen for localization test.");
  await evaluate(`document.querySelector('.language-btn[data-lang="zh"]').click()`);
  await waitFor(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('#guide-title').textContent === '认识图形'`, "Chinese guide copy did not synchronize.");
  assert(await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.narration').src.includes('/zh/contextual/goal-shape-explorer.mp3')`), "Chinese narration did not synchronize.");
  await evaluate(`document.querySelector('#soundToggle').click()`);
  assert(await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.replay-button').disabled`), "Guide mute state did not synchronize.");
  await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);
  await waitFor(`(() => {
    const guide = document.querySelector('edcloud-operation-guide');
    return guide.shadowRoot.querySelector('.guide-layer').hidden && !guide._closing && !guide._moving;
  })()`, "Localized guide did not finish closing.");

  await call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(250);
  const mobile = await evaluate(`(() => ({
    width: innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    tabs: [...document.querySelectorAll('.activity-tab')].map(button => button.getBoundingClientRect().toJSON()),
    controls: document.querySelector('.heading-actions').getBoundingClientRect().toJSON(),
    summaryHidden: document.querySelector('#liveSummary').hidden,
    fullscreenLabelDisplay: getComputedStyle(document.querySelector('#shapeFullscreenToggle span:last-child')).display,
    explorer: document.querySelector('.shape-explorer').getBoundingClientRect().toJSON(),
    propertyPanel: document.querySelector('.property-panel').getBoundingClientRect().toJSON(),
    propertyExplanation: document.querySelector('.property-explanation').getBoundingClientRect().toJSON(),
    shapeIconWidths: [...document.querySelectorAll('[data-shape] .shape-choice-icon')].map(icon => Number.parseFloat(getComputedStyle(icon).width))
  }))()`);
  assert(mobile.width === 390 && !mobile.horizontalOverflow, `Mobile layout has horizontal overflow: ${JSON.stringify(mobile)}`);
  assert(mobile.tabs.every(rect => rect.left >= 0 && rect.right <= 390), `A mobile activity tab is outside the viewport: ${JSON.stringify(mobile)}`);
  assert(mobile.summaryHidden && mobile.propertyExplanation.left >= mobile.explorer.left - 1 && mobile.propertyExplanation.right <= mobile.explorer.right + 1 && mobile.propertyExplanation.top >= mobile.propertyPanel.bottom - 1, `The mobile shape explanation layout is wrong: ${JSON.stringify(mobile)}`);
  assert(mobile.shapeIconWidths.length === 10 && mobile.shapeIconWidths.every(width => width >= 36), `Mobile crayon shape icons are missing or too small: ${JSON.stringify(mobile)}`);
  assert(mobile.fullscreenLabelDisplay === "none", `The mobile shape full-screen control is not compact: ${JSON.stringify(mobile)}`);

  await evaluate(`Object.defineProperty(document.querySelector('.shape-canvas'), 'requestFullscreen', { configurable: true, value: undefined }); document.querySelector('#shapeFullscreenToggle').click()`);
  await waitFor(`document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The iOS-style full-screen fallback did not open.");
  const mobileExpandedShape = await evaluate(`(() => {
    const canvas = document.querySelector('.shape-canvas');
    const rect = canvas.getBoundingClientRect();
    return { rect: rect.toJSON(), horizontalOverflow: canvas.scrollWidth > canvas.clientWidth, bodyLocked: getComputedStyle(document.body).overflow === 'hidden', propertiesInsideCanvas: canvas.contains(document.querySelector('.property-panel')) };
  })()`);
  assert(Math.abs(mobileExpandedShape.rect.width - 390) <= 1 && Math.abs(mobileExpandedShape.rect.height - 844) <= 1 && !mobileExpandedShape.horizontalOverflow && mobileExpandedShape.bodyLocked && !mobileExpandedShape.propertiesInsideCanvas, `The mobile shape-only full-screen fallback is outside the viewport: ${JSON.stringify(mobileExpandedShape)}`);
  await evaluate(`document.querySelector('#shapeFullscreenToggle').click(); delete document.querySelector('.shape-canvas').requestFullscreen`);
  await waitFor(`!document.querySelector('.shape-canvas').classList.contains('is-viewport-fullscreen')`, "The mobile shape full-screen fallback did not close.");

  await evaluate(`document.querySelector('.language-btn[data-lang="ms"]').click(); document.querySelector('.activity-tab[data-activity="netBuilder"]').click(); document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.actor-button').click()`);
  await waitFor(`!document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-layer').hidden`, "Mobile guide did not open.");
  const mobileCard = await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.guide-card').getBoundingClientRect().toJSON()`);
  assert(mobileCard.left >= 0 && mobileCard.right <= 390 && mobileCard.top >= 0 && mobileCard.bottom <= 844, `Mobile guide card is outside the viewport: ${JSON.stringify(mobileCard)}`);
  await evaluate(`document.querySelector('edcloud-operation-guide').shadowRoot.querySelector('.close-button').click()`);

  assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join(" | ")}`);
  console.log(JSON.stringify({
    status: "passed",
    activities: 3,
    stepsPerActivity: 5,
    contextualNarrations: 45,
    desktopWhiteboardType: true,
    brandTypePreserved: true,
    periodicChoiceNudges: true,
    reducedMotion: true,
    shapeExplanationRow: true,
    shapeCanvasFullscreen: true,
    crayonShapeIcons: 10,
    iosFullscreenFallback: true,
    mobileViewport: "390x844",
    authorizationEntry: true,
    noAuthorizationPreview: true,
    unifiedSharedComponents: true,
    completionCelebration: true
  }, null, 2));
} finally {
  socket.close();
  const browserExited = browser.exitCode !== null ? Promise.resolve() : new Promise(resolveExit => browser.once("exit", resolveExit));
  browser.kill();
  await Promise.race([browserExited, delay(1500)]);
  const resolvedProfile = resolve(profile);
  if (resolvedProfile.startsWith(resolve(tmpdir()))) {
    rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
