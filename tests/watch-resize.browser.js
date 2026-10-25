(async function () {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const settle = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
  const assertPlayerFits = () => {
    const player = rect("#movie_player");
    const video = rect("video.html5-main-video");
    assert(video.left >= player.left - 2 && video.right <= player.right + 2
      && video.top >= player.top - 2 && video.bottom <= player.bottom + 2,
    "Video must fit the restored player before any resize interaction");
  };
  const switchMode = async (theater) => {
    document.querySelector(".ytp-size-button").click();
    const host = theater ? "player-full-bleed-container" : "player";
    const deadline = performance.now() + 3000;
    while (performance.now() < deadline) {
      await settle();
      const handle = document.getElementById("yt-resize-player-width");
      if (handle.parentElement.id === host && handle.getBoundingClientRect().height > 0) return;
    }
    throw new Error("Resize handles did not follow the player after switching modes");
  };
  const key = async (id, value) => {
    const handle = document.getElementById(id);
    assert(handle && handle.getBoundingClientRect().width > 0, `Missing visible handle: ${id}`);
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true }));
    await settle();
  };

  assert(!document.querySelector("ytd-watch-flexy").hasAttribute("theater"), "Run in default mode");
  assertPlayerFits();
  const sidebarBefore = rect("ytd-watch-flexy #secondary-inner").width;
  const playerBefore = rect("ytd-watch-flexy #player").width;
  await key("yt-resize-sidebar", "ArrowLeft");
  assert(Math.abs(rect("ytd-watch-flexy #secondary-inner").width - sidebarBefore - 16) < 2,
    "Playlist width must increase by 16px");
  assert(Math.abs(rect("ytd-watch-flexy #player").width - playerBefore + 16) < 2,
    "Player must share the resized column space");

  const playerHeight = rect("#movie_player").height;
  await key("yt-resize-player-height", "ArrowUp");
  assert(Math.abs(rect("#movie_player").height - playerHeight + 16) < 2,
    "Player height must decrease by 16px");
  const playlistHeight = rect("ytd-playlist-panel-renderer").height;
  await key("yt-resize-playlist-height", "ArrowUp");
  assert(Math.abs(rect("ytd-playlist-panel-renderer").height - playlistHeight + 16) < 2,
    "Playlist height must decrease by 16px");
  const stored = await chrome.storage.local.get("watchLayout");
  assert(Math.abs(stored.watchLayout.playlistWidth - rect("ytd-watch-flexy #secondary-inner").width) < 2,
    "Playlist width must be saved locally");
  assert(Math.abs(stored.watchLayout.playerHeight - rect("#movie_player").height) < 2,
    "Player height must be saved locally");
  assert(Math.abs(stored.watchLayout.playlistHeight - rect("ytd-playlist-panel-renderer").height) < 2,
    "Playlist height must be saved locally");
  assert(document.documentElement.scrollWidth <= innerWidth, "Layout must fit the viewport");
  assertPlayerFits();
  await switchMode(true);
  const theaterWidth = rect("#movie_player").width;
  await key("yt-resize-player-width", "ArrowLeft");
  assert(Math.abs(rect("#movie_player").width - theaterWidth + 16) < 2,
    "Player width must decrease in theater mode after switching layouts");
  await switchMode(false);
  const defaultWidth = rect("#movie_player").width;
  await key("yt-resize-player-width", "ArrowRight");
  assert(Math.abs(rect("#movie_player").width - defaultWidth - 16) < 2,
    "Player width must increase after switching back to default mode");
  assertPlayerFits();
  return { passed: 12, layout: (await chrome.storage.local.get("watchLayout")).watchLayout };
})
