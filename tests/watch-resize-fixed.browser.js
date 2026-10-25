(async function () {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const settle = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
  const assertReachable = (id) => {
    const handle = document.getElementById(id);
    const r = handle.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(20, r.height / 2));
    assert(hit === handle, `Resize handle is clipped or covered: ${id}`);
  };
  const watch = document.querySelector("ytd-watch-flexy[split-scroll]");
  assert(watch, "Run on the new fixed-sidebar layout");
  const saved = (await chrome.storage.local.get("watchLayout")).watchLayout;
  assert(Math.abs(rect("ytd-watch-flexy #secondary-inner").width - saved.playlistWidth) < 2,
    "Fixed sidebar must restore the saved width, including widths below 320px");
  assert(Math.abs(rect("ytd-playlist-panel-renderer").height - saved.playlistHeight) < 2,
    "Fixed playlist must restore its saved height instead of stretching to fill the viewport");
  assert(rect("ytd-watch-flexy #secondary-inner").left >= rect("ytd-watch-flexy #player").right,
    "Fixed playlist must not overlap the video player");
  assert(rect("ytd-watch-flexy #secondary-inner").left - rect("ytd-watch-flexy #player").right < 40,
    "The fixed sidebar spacer must follow the player width");
  assertReachable("yt-resize-sidebar");
  assertReachable("yt-resize-playlist-height");
  assertReachable("yt-resize-player-width");
  assertReachable("yt-resize-player-height");
  const before = rect("ytd-watch-flexy #player").width;
  document.getElementById("yt-resize-sidebar").dispatchEvent(new KeyboardEvent("keydown", {
    key: "ArrowLeft", bubbles: true,
  }));
  await settle();
  assert(Math.abs(rect("ytd-watch-flexy #secondary-inner").width - saved.playlistWidth - 16) < 2,
    "Fixed playlist width must increase by 16px");
  assert(Math.abs(rect("ytd-watch-flexy #player").width - before + 16) < 2,
    "Video player width must decrease by 16px");
  assertReachable("yt-resize-sidebar");
  const height = rect("ytd-playlist-panel-renderer").height;
  document.getElementById("yt-resize-playlist-height").dispatchEvent(new KeyboardEvent("keydown", {
    key: "ArrowDown", bubbles: true,
  }));
  await settle();
  assert(Math.abs(rect("ytd-playlist-panel-renderer").height - height - 16) < 2,
    "Fixed playlist height must increase by 16px");
  const beforeExpand = rect("ytd-watch-flexy #player");
  const belowBefore = rect("ytd-watch-flexy #below").top;
  document.getElementById("yt-resize-sidebar").dispatchEvent(new KeyboardEvent("keydown", {
    key: "ArrowRight", bubbles: true,
  }));
  await settle();
  const expanded = rect("ytd-watch-flexy #player");
  const outer = rect("ytd-watch-flexy #player-container-outer");
  const style = getComputedStyle(watch);
  const ratio = parseFloat(style.getPropertyValue("--ytd-watch-flexy-height-ratio"))
    / parseFloat(style.getPropertyValue("--ytd-watch-flexy-width-ratio"));
  assert(Math.abs(outer.width - expanded.width) < 2,
    "Player must fill the widened column without side spacing");
  assert(Math.abs(expanded.height - expanded.width * ratio) < 2,
    "Shrinking the sidebar must restore proportional player height");
  assert(Math.abs(rect("ytd-watch-flexy #below").top - belowBefore - (expanded.height - beforeExpand.height)) < 2,
    "The section below must move with the expanded player height");
  assert((await chrome.storage.local.get("watchLayout")).watchLayout.playerHeight === undefined,
    "Sidebar resizing must persist automatic height instead of the previous fixed height");
  return { passed: 16, player: rect("ytd-watch-flexy #player").toJSON(),
    playlist: rect("ytd-playlist-panel-renderer").toJSON() };
})
