(function loadEdCloudSharedComponents() {
  "use strict";

  if (window.EdCloudSharedToolLoaderStarted) return;
  window.EdCloudSharedToolLoaderStarted = true;

  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  const isLocal = location.protocol === "file:" || localHosts.has(location.hostname);
  const rootSources = isLocal
    ? ["../edcloud-shared-components/edcloud-shared-loader.js"]
    : [
        "/edcloud-shared-components/v1/edcloud-shared-loader.js",
        "../edcloud-shared-components/edcloud-shared-loader.js"
      ];

  function readiness(globalName, readyName, validator) {
    if (validator(window[globalName])) {
      const promise = Promise.resolve(window[globalName]);
      if (!window[readyName]) window[readyName] = promise;
      return { promise, resolve() {} };
    }
    if (window[readyName]) return { promise: window[readyName], resolve() {} };
    let settle;
    const promise = new Promise(resolve => { settle = resolve; });
    window[readyName] = promise;
    return { promise, resolve: settle };
  }

  const guideReady = readiness(
    "EdCloudOperationGuide",
    "EdCloudOperationGuideReady",
    value => typeof value?.mount === "function"
  );
  const celebrationReady = readiness(
    "EdCloudCorrectCelebration",
    "EdCloudCorrectCelebrationReady",
    value => typeof value?.show === "function"
  );

  let resolveShared;
  if (!window.EdCloudSharedComponentsReady) {
    window.EdCloudSharedComponentsReady = new Promise(resolve => { resolveShared = resolve; });
  }

  function loadScriptCandidates(sources, { check, dataAttribute }) {
    if (check()) return Promise.resolve(check());
    const queue = [...sources];
    return new Promise(resolve => {
      function tryNext() {
        const source = queue.shift();
        if (!source) {
          resolve(null);
          return;
        }
        const script = document.createElement("script");
        script.src = source;
        script.async = true;
        script.dataset[dataAttribute] = "";
        script.addEventListener("load", () => {
          const value = check();
          if (value) resolve(value);
          else {
            script.remove();
            tryNext();
          }
        }, { once: true });
        script.addEventListener("error", () => {
          script.remove();
          tryNext();
        }, { once: true });
        document.head.append(script);
      }
      tryNext();
    });
  }

  function loadRoot() {
    if (window.EdCloudSharedComponents?.load) return Promise.resolve(window.EdCloudSharedComponents);
    return loadScriptCandidates(rootSources, {
      check: () => window.EdCloudSharedComponents?.load ? window.EdCloudSharedComponents : null,
      dataAttribute: "edcloudSharedComponents"
    });
  }

  function loadLegacyGuide() {
    const sources = isLocal
      ? ["../operation-guide/operation-guide.js"]
      : ["/operation-guide/v1/operation-guide.js", "../operation-guide/operation-guide.js"];
    return loadScriptCandidates(sources, {
      check: () => typeof window.EdCloudOperationGuide?.mount === "function" ? window.EdCloudOperationGuide : null,
      dataAttribute: "edcloudOperationGuide"
    });
  }

  function loadLegacyCelebration() {
    const sources = isLocal
      ? ["../correct-celebration/correct-celebration.js"]
      : ["/correct-celebration/v1/correct-celebration.js", "../correct-celebration/correct-celebration.js"];
    return loadScriptCandidates(sources, {
      check: () => typeof window.EdCloudCorrectCelebration?.show === "function" ? window.EdCloudCorrectCelebration : null,
      dataAttribute: "edcloudCorrectCelebration"
    });
  }

  loadRoot().then(async shared => {
    resolveShared?.(shared);
    const guidePromise = shared?.load
      ? shared.load("operation-guide").then(value => value || loadLegacyGuide())
      : loadLegacyGuide();
    const celebrationPromise = shared?.load
      ? shared.load("correct-celebration").then(value => value || loadLegacyCelebration())
      : loadLegacyCelebration();
    const [guide, celebration] = await Promise.all([guidePromise, celebrationPromise]);
    guideReady.resolve(guide);
    celebrationReady.resolve(celebration);
    if (!guide) console.warn("Operation guide could not be loaded; the learning tool will continue without it.");
    if (!celebration) console.warn("Correct celebration could not be loaded; the learning tool will continue without it.");
  }).catch(error => {
    console.warn("EdCloud shared components failed to initialize.", error);
    resolveShared?.(null);
    guideReady.resolve(null);
    celebrationReady.resolve(null);
  });
})();
