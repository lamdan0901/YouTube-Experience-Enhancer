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

    // YouTube reuses one <video> element across SPA navigations and swaps its
    // src, so "loadedmetadata" is the only reliable per-video signal: it fires
    // for every video with currentTime 0 and the new duration already set.
    // Media events don't bubble, but a capture-phase listener on document still
    // receives them, so we never have to locate or re-bind the element.
    // ponytail: no retry if YouTube stomps currentTime after metadata; add a
    // one-shot "playing" re-assert only if that turns out to happen.
    document.addEventListener(
      "loadedmetadata",
      (e) => {
        const video = e.target;
        if (!video.matches?.("video.html5-main-video")) return;
        if (!video.duration || video.duration <= 0) return;
        // Respect an explicit timestamp in the URL (e.g. shared ?t=90 links)
        if (new URLSearchParams(location.search).has("t")) return;

        video.currentTime = (video.duration * skipPercentage) / 100;
      },
      true
    );
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
