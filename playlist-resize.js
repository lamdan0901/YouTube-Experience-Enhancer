(function () {
  "use strict";

  function setupResizablePlaylist() {
    const PLAYLIST_MIN_WIDTH = 150;
    const PLAYLIST_MIN_WIDTH_MINIMIZED = 300;
    const PLAYLIST_MAX_WIDTH = 800;
    const playlistContainerSelector = "#panels-full-bleed-container";
    const playerContainerSelector = "#player-full-bleed-container";
    const fullBleedContainerSelector = "#full-bleed-container";

    // CSS for the drag handle and resize behavior
    const style = document.createElement("style");
    style.textContent = `
      #playlist-resize-handle {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 10px;
        cursor: ew-resize;
        z-index: 9999;
        background: transparent;
        transition: background 0.2s;
      }
      #playlist-resize-handle:hover, #playlist-resize-handle.dragging {
        background: rgba(255, 255, 255, 0.2);
      }
      ${playlistContainerSelector} {
        position: relative;
        /* Ensure min-width doesn't fight us, or set a reasonable one */
        min-width: ${PLAYLIST_MIN_WIDTH}px; 
      }
      ${playlistContainerSelector}.playlist-minimized #video-title,
      ${playlistContainerSelector}.playlist-minimized #byline-container {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    function initHandle() {
      const container = document.querySelector(playlistContainerSelector);
      if (!container) return;

      if (container.querySelector("#playlist-resize-handle")) return;

      const handle = document.createElement("div");
      handle.id = "playlist-resize-handle";
      container.appendChild(handle);

      // Restore saved width immediately when handle (and thus valid container) is found
      chrome.storage.sync.get(["playlistWidth"], (result) => {
        if (result.playlistWidth) {
          container.style.width = result.playlistWidth;

          if (parseInt(result.playlistWidth) <= PLAYLIST_MIN_WIDTH_MINIMIZED) {
            container.classList.add("playlist-minimized");
          } else {
            container.classList.remove("playlist-minimized");
          }

          // Also try to set initial player width to match
          const fullBleedContainer = document.querySelector(
            fullBleedContainerSelector
          );
          const playerContainer = document.querySelector(
            playerContainerSelector
          );
          if (fullBleedContainer && playerContainer) {
            const widthVal = parseInt(result.playlistWidth);
            if (!isNaN(widthVal)) {
              // If we can get clientWidth, great. If not, this might be 0 if hidden?
              // But initHandle is likely called when visible.
              const availableWidth = fullBleedContainer.clientWidth;
              if (availableWidth > 0) {
                const newPlayerWidth = availableWidth - widthVal;
                playerContainer.style.width = `${newPlayerWidth}px`;
              }
            }
          }
        }
      });

      let isDragging = false;
      let startX, startWidth;

      handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = container.offsetWidth;
        handle.classList.add("dragging");

        // Prevent text selection during drag
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ew-resize";

        e.preventDefault();
      });

      // Simple throttle implementation
      let lastFrameTime = 0;
      function throttle(callback) {
        const now = Date.now();
        if (now - lastFrameTime >= 16) {
          // ~60fps
          callback();
          lastFrameTime = now;
        }
      }

      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        throttle(() => {
          // Calculate new width:
          const dx = startX - e.clientX;
          const newWidth = startWidth + dx;

          // Min/Max constraints
          if (newWidth > PLAYLIST_MIN_WIDTH && newWidth < PLAYLIST_MAX_WIDTH) {
            container.style.width = `${newWidth}px`;

            if (newWidth <= PLAYLIST_MIN_WIDTH_MINIMIZED) {
              container.classList.add("playlist-minimized");
            } else {
              container.classList.remove("playlist-minimized");
            }

            // Update player width responsively
            const fullBleedContainer = document.querySelector(
              fullBleedContainerSelector
            );
            const playerContainer = document.querySelector(
              playerContainerSelector
            );

            if (fullBleedContainer && playerContainer) {
              const availableWidth = fullBleedContainer.clientWidth;
              // Just simple subtraction might be enough if they are side-by-side in full-bleed
              const newPlayerWidth = availableWidth - newWidth;
              playerContainer.style.width = `${newPlayerWidth}px`;
            }
          }
        });
      });

      document.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          handle.classList.remove("dragging");
          document.body.style.userSelect = "";
          document.body.style.cursor = "";

          chrome.storage.sync.set({ playlistWidth: container.style.width });

          // Trigger a window resize event to force YouTube to re-layout internal components (like the player controls/scrubber)
          window.dispatchEvent(new Event("resize"));
        }
      });
    }

    // Attempt to init immediately and on navigation
    initHandle();

    // Re-run init on periodic check
    setInterval(initHandle, 2000);
  }

  setupResizablePlaylist();
})();
