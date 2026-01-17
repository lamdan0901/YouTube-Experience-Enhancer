(function () {
  "use strict";

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

  setupTooltip();
})();
