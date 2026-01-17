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
})();
