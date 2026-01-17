(function () {
  "use strict";

  // Function to apply or remove custom columns based on screen width
  function updateColumnSettings(columns, minScreenWidth) {
    const applyCustomColumns = window.innerWidth >= minScreenWidth;

    if (applyCustomColumns) {
      // Apply custom columns
      document.documentElement.style.setProperty("--youtube-columns", columns);
      document.documentElement.style.setProperty(
        "--apply-custom-columns",
        "true"
      );
    } else {
      // Reset to YouTube's default behavior
      document.documentElement.style.removeProperty("--youtube-columns");
      document.documentElement.style.setProperty(
        "--apply-custom-columns",
        "false"
      );
    }
  }

  // Function to handle shorts and end recommendations visibility
  function updateVisibility(hideShorts, hideEndRecommendations) {
    // Handle YouTube Shorts visibility
    const shortsElements = document.querySelectorAll("[is-shorts]");
    shortsElements.forEach((el) => {
      el.setAttribute("data-hidden", hideShorts ? "true" : "false");
    });

    // Handle end recommendations visibility
    const endRecElements = document.querySelectorAll(".ytp-ce-element");
    endRecElements.forEach((el) => {
      el.setAttribute("data-hidden", hideEndRecommendations ? "true" : "false");
    });
  }

  // Function to handle auto-skip functionality
  function setupAutoSkip(autoSkip, skipPercentage) {
    if (!autoSkip) return;

    let processedVideos = new Set();

    function handleVideoLoad() {
      const video = document.querySelector("video.html5-main-video");
      if (!video) return;

      const videoId = new URLSearchParams(window.location.search).get("v");
      if (!videoId || processedVideos.has(videoId)) return;

      const skipToTime = () => {
        if (video.duration && video.duration > 0 && video.currentTime < 1) {
          const targetTime = (video.duration * skipPercentage) / 100;
          video.currentTime = targetTime;
          processedVideos.add(videoId);
        }
      };

      // Try to skip when metadata is loaded
      if (video.readyState >= 1) {
        skipToTime();
      } else {
        video.addEventListener("loadedmetadata", skipToTime, { once: true });
      }
    }

    // Handle initial page load
    handleVideoLoad();

    // Handle navigation (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(handleVideoLoad, 500);
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  // Get settings from storage
  chrome.storage.sync.get(
    [
      "columns",
      "minScreenWidth",
      "hideShorts",
      "hideEndRecommendations",
      "autoSkip",
      "skipPercentage",
    ],
    (result) => {
      const columns = result.columns || 5;
      const minScreenWidth =
        result.minScreenWidth !== undefined ? result.minScreenWidth : 1740;

      // Initial application of settings
      updateColumnSettings(columns, minScreenWidth);
      updateVisibility(
        result.hideShorts || false,
        result.hideEndRecommendations || false
      );

      // Setup auto-skip functionality
      setupAutoSkip(result.autoSkip || false, result.skipPercentage || 10);

      // Add resize event listener with debounce to improve performance
      let resizeTimeout;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          updateColumnSettings(columns, minScreenWidth);
        }, 100); // 100ms debounce
      });

      // Add mutation observer to handle dynamically loaded content
      const observer = new MutationObserver(() => {
        updateVisibility(
          result.hideShorts || false,
          result.hideEndRecommendations || false
        );
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, { childList: true, subtree: true });
    }
  );

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ignore if typing in an input or content editable element
      if (
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) ||
        document.activeElement.isContentEditable
      ) {
        return;
      }

      // Check if YouTube is in fullscreen mode
      if (!document.fullscreenElement) return;

      // P Key - Toggle Playlist
      if (e.code === "KeyP" || e.key.toLowerCase() === "p") {
        const closeButton = document.querySelector(
          "button.yt-icon-button[aria-label='Collapse']"
        );
        const openButton = document.querySelector(".ytp-playlist-menu-button");

        // If the close button exists and is visible, close it.
        // Otherwise, try to open it.
        if (closeButton && closeButton.offsetParent !== null) {
          closeButton.click();
        } else if (openButton) {
          openButton.click();
        }
      }

      // X Key - Toggle Comments
      if (e.code === "KeyX" || e.key.toLowerCase() === "x") {
        const commentOpenButton = document.querySelector(
          "button[aria-label='Comments']"
        );
        const commentCloseButton = document.querySelector(
          "button.yt-spec-button-shape-next--icon-only-default[aria-label='Close']"
        );

        if (commentCloseButton && commentCloseButton.offsetParent !== null) {
          commentCloseButton.click();
        } else if (commentOpenButton) {
          commentOpenButton.click();
        }
      }
    });
  }

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

    // Restore saved width
    // We probably want to apply the player width adjustment here too if we can
    // Restore moved to initHandle to ensure it runs on every new container found

    // Re-run init on periodic check
    setInterval(initHandle, 2000);
  }

  function setupTooltip() {
    const tooltip = document.createElement("div");
    tooltip.id = "yt-custom-tooltip";
    document.body.appendChild(tooltip);

    const playlistContainerSelector = "#panels-full-bleed-container";

    function updateTooltip(e) {
      const container = document.querySelector(playlistContainerSelector);
      if (!container || !container.classList.contains("playlist-minimized")) {
        tooltip.style.display = "none";
        return;
      }

      // Find the ytd-playlist-panel-video-renderer element
      const videoItem = e.target.closest("ytd-playlist-panel-video-renderer");
      if (!videoItem) {
        tooltip.style.display = "none";
        return;
      }

      // Only show if we are actually hovering over the item (double check not needed due to mouseenter/leave but safe)
      const titleElement = videoItem.querySelector("#video-title");
      if (!titleElement) return;

      tooltip.textContent = titleElement.innerText.trim();
      tooltip.style.display = "block";

      // Position logic: left of the video item
      const rect = videoItem.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Calculate positions
      let top = rect.top + (rect.height - tooltipRect.height) / 2;
      let left = rect.left - tooltipRect.width - 10; // 10px gap

      // Ensure it doesn't go off-screen
      if (left < 10) left = 10;
      if (top < 10) top = 10;
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - 10 - tooltipRect.height;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }

    function hideTooltip() {
      tooltip.style.display = "none";
    }

    // Use event delegation for dynamic content
    document.addEventListener("mouseover", (e) => {
      const container = document.querySelector(playlistContainerSelector);
      if (
        container &&
        container.classList.contains("playlist-minimized") &&
        e.target.closest("ytd-playlist-panel-video-renderer")
      ) {
        updateTooltip(e);
      } else {
        hideTooltip();
      }
    });

    document.addEventListener("mouseout", (e) => {
      const container = document.querySelector(playlistContainerSelector);
      if (
        container &&
        container.classList.contains("playlist-minimized") &&
        e.target.closest("ytd-playlist-panel-video-renderer")
      ) {
        if (
          !e.relatedTarget ||
          !e.relatedTarget.closest("ytd-playlist-panel-video-renderer")
        ) {
          hideTooltip();
        }
      }
    });
  }

  setupResizablePlaylist();
  setupKeyboardShortcuts();
  setupTooltip();
})();
