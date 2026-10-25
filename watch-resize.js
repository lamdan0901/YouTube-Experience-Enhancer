(function () {
  "use strict";

  let layout = {};
  let watch;
  let drag = null;
  let frame = 0;
  let measuredPlayer = null;
  let measuredSize = "";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sidebar() {
    const panel = watch.querySelector("#panels-full-bleed-container");
    return panel && panel.getBoundingClientRect().width > 0
      ? panel : watch.querySelector("#secondary-inner");
  }

  function player() {
    return watch.querySelector(watch.querySelector("#player-full-bleed-container #movie_player")
      ? "#player-full-bleed-container" : "#player");
  }

  function limits(kind) {
    if (kind === "playlistWidth") {
      const columns = watch.querySelector("#columns");
      return [150, Math.max(150, Math.min(800, columns.clientWidth - 384))];
    }
    if (kind === "theaterPlayerWidth") {
      const full = watch.querySelector("#full-bleed-container");
      const panel = watch.querySelector("#panels-full-bleed-container");
      const available = full.clientWidth - (panel ? panel.getBoundingClientRect().width : 0);
      return [Math.min(320, available), available];
    }
    const currentHeight = kind === "playerHeight" ? player().getBoundingClientRect().height : 0;
    return [180, Math.max(180, window.innerHeight - 80, currentHeight)];
  }

  function saveLayout() {
    chrome.storage.local.set({ watchLayout: layout }, () => {
      if (chrome.runtime.lastError) {
        console.error("Could not save YouTube sizes:", chrome.runtime.lastError.message);
      }
    });
  }

  function applyLayout() {
    for (const [key, cssName, attribute] of [
      ["playlistWidth", "sidebar-width", "data-yt-sidebar-size"],
      ["playerHeight", "player-height", "data-yt-player-size"],
      ["playlistHeight", "playlist-height", "data-yt-playlist-size"],
      ["theaterPlayerWidth", "theater-width", "data-yt-theater-size"],
    ]) {
      if (Number.isFinite(layout[key]) && layout[key] > 0) {
        watch.style.setProperty(`--yt-layout-${cssName}`, `${clamp(layout[key], ...limits(key))}px`);
        watch.setAttribute(attribute, "");
      }
    }
    const list = watch.querySelector("ytd-playlist-panel-renderer");
    if (list) {
      const width = list.getBoundingClientRect().width;
      list.classList.toggle("playlist-minimized", width > 0 && width <= 300);
    }
  }

  function resize(kind, value) {
    layout[kind] = Math.round(clamp(value, ...limits(kind)));
    if (kind === "playlistWidth" && player().id === "player") {
      // Width resizing returns the player to YouTube's natural video aspect ratio.
      delete layout.playerHeight;
      watch.removeAttribute("data-yt-player-size");
    }
    applyLayout();
    scheduleUpdate();
  }

  function addHandle(host, id, label, vertical, getKind, getValue, direction = () => 1) {
    if (!host) return;
    let handle = watch.querySelector(`#${id}`);
    if (handle) {
      if (handle.parentElement !== host) host.appendChild(handle);
      return;
    }
    handle = document.createElement("div");
    handle.id = id;
    handle.className = `yt-layout-handle ${vertical ? "yt-layout-height" : "yt-layout-width"}`;
    handle.tabIndex = 0;
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", label);
    handle.setAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
    handle.title = `${label}. Drag or use arrow keys. Double-click to reset.`;
    host.appendChild(handle);

    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      drag = { handle, kind: getKind(), start: vertical ? event.clientY : event.clientX,
        value: getValue(), vertical, direction: direction() };
      document.documentElement.classList.add("yt-layout-dragging");
      document.documentElement.style.setProperty("--yt-layout-cursor", vertical ? "ns-resize" : "ew-resize");
    });
    handle.addEventListener("pointermove", (event) => {
      if (!drag || drag.handle !== handle) return;
      const coordinate = drag.vertical ? event.clientY : event.clientX;
      resize(drag.kind, drag.value + (coordinate - drag.start) * drag.direction);
    });
    function finishDrag() {
      if (!drag || drag.handle !== handle) return;
      drag = null;
      document.documentElement.classList.remove("yt-layout-dragging");
      document.documentElement.style.removeProperty("--yt-layout-cursor");
      saveLayout();
    }
    handle.addEventListener("pointerup", finishDrag);
    handle.addEventListener("pointercancel", finishDrag);
    handle.addEventListener("lostpointercapture", finishDrag);
    handle.addEventListener("keydown", (event) => {
      const keys = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
      const index = keys.indexOf(event.key);
      if (index === -1) return;
      event.preventDefault();
      event.stopPropagation();
      resize(getKind(), getValue() + (index === 0 ? -16 : 16) * direction());
      saveLayout();
    });
    handle.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const kind = getKind();
      delete layout[kind];
      const attribute = { playlistWidth: "data-yt-sidebar-size", playerHeight: "data-yt-player-size",
        playlistHeight: "data-yt-playlist-size", theaterPlayerWidth: "data-yt-theater-size" }[kind];
      watch.removeAttribute(attribute);
      applyLayout();
      saveLayout();
      scheduleUpdate();
    });
  }

  function update() {
    frame = 0;
    watch = document.querySelector("ytd-watch-flexy:not([hidden])");
    if (!watch || location.pathname !== "/watch" || document.fullscreenElement || watch.hasAttribute("fullscreen")) return;
    const list = watch.querySelector("ytd-playlist-panel-renderer");
    const video = player();
    const side = sidebar();
    if (!video || !side) return;
    watch.toggleAttribute("data-yt-full-bleed", video.id === "player-full-bleed-container");
    applyLayout();
    addHandle(side, "yt-resize-sidebar", "Resize player and playlist width", false,
      () => "playlistWidth", () => sidebar().getBoundingClientRect().width, () => -1);
    addHandle(video, "yt-resize-player-width", "Resize player width", false,
      () => player().id === "player-full-bleed-container" ? "theaterPlayerWidth" : "playlistWidth",
      () => player().id === "player-full-bleed-container" ? player().getBoundingClientRect().width : sidebar().getBoundingClientRect().width,
      () => player().id === "player-full-bleed-container" ? 1 : -1);
    addHandle(video, "yt-resize-player-height", "Resize player height", true,
      () => "playerHeight", () => player().getBoundingClientRect().height);
    addHandle(list, "yt-resize-playlist-height", "Resize playlist height", true,
      () => "playlistHeight", () => watch.querySelector("ytd-playlist-panel-renderer").getBoundingClientRect().height);
    for (const handle of watch.querySelectorAll(".yt-layout-handle")) {
      if (handle.id === "yt-resize-sidebar") {
        handle.style.height = `${(list || video).getBoundingClientRect().height}px`;
      }
      const kind = handle.id === "yt-resize-player-height" ? "playerHeight"
        : handle.id === "yt-resize-playlist-height" ? "playlistHeight"
        : handle.id === "yt-resize-player-width" && video.id === "player-full-bleed-container" ? "theaterPlayerWidth" : "playlistWidth";
      let [min, max] = limits(kind);
      let value = kind === "playlistWidth" ? side.getBoundingClientRect().width
        : kind === "playlistHeight" ? list.getBoundingClientRect().height
        : kind === "playerHeight" ? video.getBoundingClientRect().height : video.getBoundingClientRect().width;
      if (handle.id === "yt-resize-player-width" && kind === "playlistWidth") {
        const total = video.getBoundingClientRect().width + value;
        [min, max] = [total - max, total - min];
        value = video.getBoundingClientRect().width;
      }
      handle.setAttribute("aria-valuemin", Math.round(min));
      handle.setAttribute("aria-valuemax", Math.round(max));
      handle.setAttribute("aria-valuenow", Math.round(value));
    }
    const movie = watch.querySelector("#movie_player");
    const bounds = video.getBoundingClientRect();
    const size = `${bounds.width}:${bounds.height}`;
    if (movie && (movie !== measuredPlayer || size !== measuredSize)) {
      measuredPlayer = movie;
      measuredSize = size;
      // Restoring sizes also requires YouTube to remeasure the video and controls.
      window.dispatchEvent(new Event("resize"));
    }
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  chrome.storage.local.get(["watchLayout"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Could not load YouTube sizes:", chrome.runtime.lastError.message);
      return;
    }
    function start(saved) {
      if (saved && typeof saved === "object") {
        for (const key of ["playlistWidth", "playerHeight", "playlistHeight", "theaterPlayerWidth"]) {
          if (Number.isFinite(saved[key]) && saved[key] > 0) layout[key] = saved[key];
        }
      }
      new MutationObserver(scheduleUpdate).observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["theater", "fullscreen", "hidden", "is-two-columns_", "split-scroll",
          "fixed-panel-expanded", "side-rail-dismissible-panels", "panels-beside-player"],
      });
      document.addEventListener("yt-navigate-finish", scheduleUpdate);
      document.addEventListener("fullscreenchange", scheduleUpdate);
      window.addEventListener("resize", scheduleUpdate);
      update();
    }
    if (result.watchLayout) {
      start(result.watchLayout);
    } else {
      // Preserve the previous synced playlist preference when upgrading.
      chrome.storage.sync.get(["playlistWidth"], (legacy) => {
        if (chrome.runtime.lastError) {
          console.error("Could not load previous playlist size:", chrome.runtime.lastError.message);
          start();
          return;
        }
        const width = typeof legacy.playlistWidth === "string" && /^\d+(\.\d+)?px$/.test(legacy.playlistWidth)
          ? parseFloat(legacy.playlistWidth) : legacy.playlistWidth;
        start({ playlistWidth: width });
        if (Number.isFinite(width) && width > 0) saveLayout();
      });
    }
  });
})();
