const EDCLOUD_TOOL_PROTOCOL_VERSION = "1";
const DEFAULT_AUTH_TIMEOUT_MS = 15_000;
const READY_RETRY_INTERVAL_MS = 500;

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getLauncherWindow() {
  if (window.opener && !window.opener.closed) {
    return window.opener;
  }

  if (window.parent && window.parent !== window) {
    return window.parent;
  }

  throw new Error("This tool must be launched from EdCloud.");
}

function normalizeAllowedOrigins(origins) {
  if (origins === undefined) {
    return null;
  }

  if (!Array.isArray(origins) || origins.length === 0) {
    throw new Error("allowedLauncherOrigins must contain at least one origin.");
  }

  return new Set(
    origins.map((value) => {
      const url = new URL(value);
      const isSecureOrigin = url.protocol === "https:";
      const isLocalDevelopmentOrigin =
        url.protocol === "http:" && url.hostname === "localhost";

      if (!isSecureOrigin && !isLocalDevelopmentOrigin) {
        throw new Error("Launcher origins must use HTTPS.");
      }

      return url.origin;
    }),
  );
}

async function verifyToolsToken(accessToken, signal) {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
    credentials: "omit",
    signal,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? "EdCloud authentication is temporarily unavailable."
        : "EdCloud rejected the Tools token.",
    );
  }

  const profile = await response.json();
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new Error("EdCloud returned an invalid authentication profile.");
  }

  return Object.freeze(profile);
}

/**
 * Completes the EdCloud Tool postMessage v1 handshake.
 *
 * The access token is held only in memory. Do not write the returned session
 * to a URL, browser storage, logs, analytics, or error reports.
 * Omit allowedLauncherOrigins only for an opaque native parent. Web launchers
 * must always supply an explicit allowlist.
 */
export function authenticateEdCloudTool(options = {}) {
  const params = new URLSearchParams(window.location.search);
  const launchId = params.get("edcloud_launch_id");
  const protocolVersion = params.get("edcloud_protocol");

  let launcherWindow;
  let allowedOrigins;

  try {
    launcherWindow = getLauncherWindow();
    allowedOrigins = normalizeAllowedOrigins(options.allowedLauncherOrigins);
  } catch (error) {
    return Promise.reject(error);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_AUTH_TIMEOUT_MS;

  if (
    protocolVersion !== EDCLOUD_TOOL_PROTOCOL_VERSION ||
    !launchId ||
    !isUuid(launchId)
  ) {
    return Promise.reject(new Error("Invalid EdCloud launch context."));
  }

  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60_000) {
    return Promise.reject(new Error("Invalid authentication timeout."));
  }

  const mayHaveOpaqueNativeParent =
    (options.allowOpaqueLauncherOrigin === true || allowedOrigins === null) &&
    (!window.opener || window.opener.closed) &&
    launcherWindow === window.parent;

  if (!allowedOrigins && !mayHaveOpaqueNativeParent) {
    return Promise.reject(
      new Error("Trusted launcher origins are required for web launchers."),
    );
  }

  return new Promise((resolve, reject) => {
    let authorizing = false;
    let settled = false;
    let timeoutId = 0;
    let readyIntervalId = 0;
    const abortController = new AbortController();

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
      window.clearInterval(readyIntervalId);
      abortController.abort();
    };

    const postLauncherMessage = (message, targetOrigin) => {
      if (targetOrigin) {
        launcherWindow.postMessage(message, targetOrigin);
      } else if (mayHaveOpaqueNativeParent) {
        // An opaque native wrapper has the literal origin "null". postMessage
        // requires "*" to reach it; incoming messages remain source-checked.
        launcherWindow.postMessage(message, "*");
      } else {
        allowedOrigins.forEach((origin) => {
          launcherWindow.postMessage(message, origin);
        });
      }
    };

    const postAuthenticationError = (code, targetOrigin) => {
      postLauncherMessage(
        {
          type: "EDCLOUD_TOOL_AUTH_ERROR",
          version: EDCLOUD_TOOL_PROTOCOL_VERSION,
          launchId,
          code,
        },
        targetOrigin,
      );
    };

    const finish = (callback, value) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback(value);
    };

    const handleMessage = async (event) => {
      const isTrustedWebOrigin = allowedOrigins?.has(event.origin) === true;
      const isOpaqueNativeParent =
        mayHaveOpaqueNativeParent && event.origin === "null";

      if (
        settled ||
        authorizing ||
        event.source !== launcherWindow ||
        (!isTrustedWebOrigin && !isOpaqueNativeParent)
      ) {
        return;
      }

      const message = event.data;
      if (
        !message ||
        typeof message !== "object" ||
        Array.isArray(message) ||
        message.type !== "EDCLOUD_TOOL_AUTH" ||
        message.version !== EDCLOUD_TOOL_PROTOCOL_VERSION ||
        message.launchId !== launchId ||
        message.tokenType !== "Bearer" ||
        typeof message.accessToken !== "string" ||
        message.accessToken.length === 0 ||
        message.accessToken.length > 16_384
      ) {
        return;
      }

      authorizing = true;
      window.clearInterval(readyIntervalId);

      try {
        const profile = await verifyToolsToken(
          message.accessToken,
          abortController.signal,
        );

        // Token validation may finish after the overall handshake timed out.
        if (settled) {
          return;
        }

        const replyOrigin = isOpaqueNativeParent ? "*" : event.origin;
        launcherWindow.postMessage(
          {
            type: "EDCLOUD_TOOL_AUTH_ACK",
            version: EDCLOUD_TOOL_PROTOCOL_VERSION,
            launchId,
          },
          replyOrigin,
        );

        finish(
          resolve,
          Object.freeze({
            accessToken: message.accessToken,
            tokenType: "Bearer",
            profile,
          }),
        );
      } catch (error) {
        if (!settled) {
          const replyOrigin = isOpaqueNativeParent ? "*" : event.origin;
          postAuthenticationError("TOKEN_VALIDATION_FAILED", replyOrigin);
        }
        finish(
          reject,
          error instanceof Error
            ? error
            : new Error("EdCloud authentication failed."),
        );
      }
    };

    timeoutId = window.setTimeout(() => {
      postAuthenticationError("HANDSHAKE_TIMEOUT");
      finish(reject, new Error("EdCloud authentication timed out."));
    }, timeoutMs);

    window.addEventListener("message", handleMessage);
    const readyMessage = {
      type: "EDCLOUD_TOOL_READY",
      version: EDCLOUD_TOOL_PROTOCOL_VERSION,
      launchId,
    };

    // READY contains no credentials. Repeat it until AUTH arrives so a
    // launcher cannot miss the only message while attaching its listener.
    postLauncherMessage(readyMessage);
    readyIntervalId = window.setInterval(() => {
      if (!settled && !authorizing) {
        postLauncherMessage(readyMessage);
      }
    }, READY_RETRY_INTERVAL_MS);
  });
}

export function createToolsAuthorizationHeader(session) {
  if (
    !session ||
    session.tokenType !== "Bearer" ||
    typeof session.accessToken !== "string" ||
    session.accessToken.length === 0
  ) {
    throw new Error("A valid EdCloud Tool session is required.");
  }

  return `Bearer ${session.accessToken}`;
}
