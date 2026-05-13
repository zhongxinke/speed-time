(function () {
  const STYLE_ID = "video-effective-time-overlay-style";
  const BOUND_ATTR = "data-video-effective-time-bound";
  const BADGE_ATTR = "data-video-effective-time-badge";
  const HIDE_DELAY_MS = 1800;

  const PLATFORM_CONFIGS = [
    {
      name: "youtube",
      hostPattern: /(^|\.)youtube\.com$/,
      controlSelector:
        ".ytp-right-controls, .ytp-left-controls, .ytp-chrome-controls",
    },
    {
      name: "bilibili",
      hostPattern: /(^|\.)bilibili\.com$/,
      controlSelector:
        ".bpx-player-control-bottom-right, .bpx-player-control-bottom, .bilibili-player-video-control-bottom-right, .bilibili-player-video-control-bottom",
    },
    {
      name: "tencent-video",
      hostPattern: /(^|\.)v\.qq\.com$/,
      controlSelector: ".txp_controls .txp_right_controls, .txp_controls",
    },
    {
      name: "iqiyi",
      hostPattern: /(^|\.)iqiyi\.com$/,
      controlSelector: ".iqp-bottom-right, .iqp-bottom-controls",
    },
    {
      name: "youku",
      hostPattern: /(^|\.)youku\.com$/,
      controlSelector: ".control-right-grid, .control-area",
    },
  ];

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "--:--";
    }

    const totalSeconds = Math.round(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function formatRate(rate) {
    return Number.isInteger(rate)
      ? `${rate}`
      : `${rate}`.replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatEffectiveTime(duration, rate) {
    if (!Number.isFinite(duration) || rate <= 0) {
      return "--:--";
    }

    return formatTime(duration / rate);
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${BADGE_ATTR}="1"] {
        z-index: 30;
        display: inline-flex;
        align-items: center;
        gap: 0;
        box-sizing: border-box;
        border-radius: 999px;
        color: #ffffff;
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
        user-select: none;
      }

      [${BADGE_ATTR}="1"] .video-effective-time-separator {
        margin: 0 6px;
        opacity: 0.5;
      }

      [${BADGE_ATTR}="1"][data-mode="overlay"] {
        position: absolute;
        left: 14px;
        top: 14px;
        max-width: calc(100% - 28px);
        padding: 7px 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(17, 24, 39, 0.68);
        backdrop-filter: blur(10px);
        pointer-events: none;
        opacity: 0;
        transform: translateY(-6px);
        transition: opacity 160ms ease, transform 160ms ease;
      }

      [${BADGE_ATTR}="1"][data-mode="overlay"].is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      [${BADGE_ATTR}="1"][data-mode="control-bar"] {
        position: relative;
        margin-left: 8px;
        padding: 0 8px;
        height: 24px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: rgba(0, 0, 0, 0.42);
        opacity: 0.92;
        pointer-events: none;
      }

      [${BADGE_ATTR}="1"][data-platform="youtube"] {
        float: left;
        // height: 100%;
        align-self: center;
      }

      @media (max-width: 640px) {
        [${BADGE_ATTR}="1"][data-mode="overlay"] {
          left: 10px;
          top: 10px;
          max-width: calc(100% - 20px);
          padding: 6px 9px;
          font-size: 11px;
        }

        [${BADGE_ATTR}="1"][data-mode="control-bar"] {
          margin-left: 6px;
          padding: 0 7px;
          height: 22px;
          font-size: 11px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createBadge(mode) {
    const badge = document.createElement("div");
    badge.setAttribute(BADGE_ATTR, "1");
    badge.dataset.mode = mode;
    badge.innerHTML = [
      '<span data-field="rate">1x</span>',
      '<span class="video-effective-time-separator">·</span>',
      '<span data-field="effective">--:--</span>',
    ].join("");
    return badge;
  }

  function getPlatformConfig() {
    const host = window.location.hostname;
    return (
      PLATFORM_CONFIGS.find((config) => config.hostPattern.test(host)) || null
    );
  }

  function getPlayerRoot(video) {
    return (
      video.closest(".html5-video-player") ||
      video.closest(".bpx-player-container") ||
      video.closest(".bilibili-player-video") ||
      video.closest(".txp_videos_container") ||
      video.closest(".iqp-player") ||
      video.closest(".youku-player") ||
      video.parentElement
    );
  }

  function getBadgeMode(video) {
    const config = getPlatformConfig();
    if (!config) {
      return "overlay";
    }

    const playerRoot = getPlayerRoot(video);
    if (!playerRoot) {
      return "overlay";
    }

    return playerRoot.querySelector(config.controlSelector)
      ? "control-bar"
      : "overlay";
  }

  function ensureOverlayAnchor(video) {
    const container = getPlayerRoot(video) || video.parentElement;
    if (!container) {
      return null;
    }

    const computedStyle = window.getComputedStyle(container);
    if (computedStyle.position === "static") {
      container.style.position = "relative";
    }

    return container;
  }

  function findControlBarAnchor(video) {
    const config = getPlatformConfig();
    if (!config) {
      return null;
    }

    const playerRoot = getPlayerRoot(video);
    if (!playerRoot) {
      return null;
    }

    return playerRoot.querySelector(config.controlSelector);
  }

  function getBadgeHost(video, mode) {
    if (mode === "control-bar") {
      return findControlBarAnchor(video);
    }

    return ensureOverlayAnchor(video);
  }

  function cleanupDetachedBadge(video) {
    if (!video.__videoEffectiveTimeBadge) {
      return;
    }

    if (video.__videoEffectiveTimeBadge.isConnected) {
      return;
    }

    video.__videoEffectiveTimeBadge = null;
    video.__videoEffectiveTimeMode = null;
  }

  function ensureBadge(video) {
    cleanupDetachedBadge(video);

    const mode = getBadgeMode(video);
    const host = getBadgeHost(video, mode);
    if (!host) {
      return null;
    }
    const platform = getPlatformConfig();

    let badge = video.__videoEffectiveTimeBadge;
    if (!badge || video.__videoEffectiveTimeMode !== mode) {
      if (badge) {
        badge.remove();
      }

      badge = createBadge(mode);
      video.__videoEffectiveTimeBadge = badge;
      video.__videoEffectiveTimeMode = mode;
      host.appendChild(badge);
      return badge;
    }

    if (badge.parentElement !== host) {
      host.appendChild(badge);
    }

    if (platform) {
      badge.dataset.platform = platform.name;
    } else {
      delete badge.dataset.platform;
    }

    return badge;
  }

  function updateBadge(video) {
    const badge = ensureBadge(video);
    if (!badge) {
      return null;
    }

    const rateField = badge.querySelector('[data-field="rate"]');
    const effectiveField = badge.querySelector('[data-field="effective"]');
    const rate = video.playbackRate > 0 ? video.playbackRate : 1;

    if (rateField) {
      rateField.textContent = `${formatRate(rate)}x`;
    }

    if (effectiveField) {
      effectiveField.textContent = formatEffectiveTime(video.duration, rate);
    }

    badge.title = `原时长 ${formatTime(video.duration)}，当前倍速 ${formatRate(rate)}x，实际观看约 ${formatEffectiveTime(video.duration, rate)}`;
    return badge;
  }

  function showBadge(video, persistent) {
    const badge = updateBadge(video);
    if (!badge) {
      return;
    }

    if (badge.dataset.mode === "control-bar") {
      return;
    }

    badge.classList.add("is-visible");

    if (video.__videoEffectiveTimeHideTimer) {
      window.clearTimeout(video.__videoEffectiveTimeHideTimer);
      video.__videoEffectiveTimeHideTimer = null;
    }

    if (persistent) {
      return;
    }

    video.__videoEffectiveTimeHideTimer = window.setTimeout(() => {
      badge.classList.remove("is-visible");
      video.__videoEffectiveTimeHideTimer = null;
    }, HIDE_DELAY_MS);
  }

  function hideBadge(video) {
    if (!video) {
      return;
    }

    const badge = video.__videoEffectiveTimeBadge;
    if (!badge || badge.dataset.mode === "control-bar") {
      return;
    }

    if (video.__videoEffectiveTimeHideTimer) {
      window.clearTimeout(video.__videoEffectiveTimeHideTimer);
      video.__videoEffectiveTimeHideTimer = null;
    }

    badge.classList.remove("is-visible");
  }

  function onVideoEvent(event) {
    const video = event.currentTarget;
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }

    const badge = updateBadge(video);
    const isControlBarMode = badge && badge.dataset.mode === "control-bar";
    if (isControlBarMode) {
      return;
    }

    if (event.type === "emptied" || event.type === "ended") {
      hideBadge(video);
      return;
    }

    if (event.type === "pause") {
      showBadge(video, true);
      return;
    }

    if (event.type === "mouseenter" || event.type === "mousemove") {
      showBadge(video, !video.paused);
      return;
    }

    if (event.type === "mouseleave") {
      if (video.paused) {
        return;
      }
      hideBadge(video);
      return;
    }

    showBadge(video, false);
  }

  function bindVideo(video) {
    if (
      !(video instanceof HTMLVideoElement) ||
      video.getAttribute(BOUND_ATTR) === "1"
    ) {
      return;
    }

    video.setAttribute(BOUND_ATTR, "1");

    [
      "loadedmetadata",
      "durationchange",
      "ratechange",
      "play",
      "pause",
      "emptied",
      "ended",
      "mouseenter",
      "mouseleave",
      "mousemove",
    ].forEach((eventName) => {
      video.addEventListener(eventName, onVideoEvent);
    });

    updateBadge(video);
  }

  function bindExistingVideos() {
    const videos = document.querySelectorAll("video");
    videos.forEach(bindVideo);
  }

  function init() {
    ensureStyle();
    bindExistingVideos();

    ["play", "loadedmetadata", "pointerdown", "keydown"].forEach(
      (eventName) => {
        document.addEventListener(
          eventName,
          () => {
            bindExistingVideos();
          },
          true,
        );
      },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
