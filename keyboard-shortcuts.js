(function () {
  "use strict";

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

  setupKeyboardShortcuts();
})();
