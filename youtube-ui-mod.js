(function () {
  "use strict";

  // Configuration
  let minScreenWidth = 1440; // Default minimum screen width for UI modifications
  let checkInterval = null; // Interval for checking UI elements

  // Function to update UI based on screen width
  function updateYouTubeUI() {
    const applyUIModifications = window.innerWidth >= minScreenWidth;
    console.log(
      `Updating UI. Screen width: ${window.innerWidth}, Min width: ${minScreenWidth}, Apply modifications: ${applyUIModifications}`
    );
    document.documentElement.setAttribute(
      "data-yt-ui-mod",
      applyUIModifications ? "true" : "false"
    );
  }

  // Function to handle mutations (for dynamically loaded content)
  function handleMutations(mutations) {
    // Check if the action buttons or dropdown menu have been added/modified
    const shouldCheck = mutations.some((mutation) => {
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this node or its children contain relevant elements
          return (
            node.querySelector("#top-level-buttons-computed") ||
            node.querySelector("tp-yt-paper-listbox") ||
            node.querySelector("ytd-menu-renderer") ||
            node.id === "top-level-buttons-computed" ||
            node.tagName === "TP-YT-PAPER-LISTBOX" ||
            node.tagName === "YTD-MENU-RENDERER"
          );
        }
        return false;
      });
    });

    if (shouldCheck) {
      // Reset saveButtonInfo is no longer needed as we hardcode it
      // saveButtonInfo = null;
      updateYouTubeUI();
    }
  }

  // Function to check for UI elements periodically
  function startPeriodicCheck() {
    // Clear any existing interval
    if (checkInterval) {
      clearInterval(checkInterval);
    }

    // Set up a new interval
    checkInterval = setInterval(() => {
      // Only run checks if we're on a video page
      if (window.location.pathname.includes("/watch")) {
        const actionsContainer = document.querySelector(
          "#top-level-buttons-computed"
        );
        const menuButton = document.querySelector(
          "ytd-menu-renderer yt-button-shape"
        );

        // If we have the necessary elements but no Save button, try to create it
        if (
          actionsContainer &&
          menuButton &&
          !document.querySelector(".yt-save-button-mod") &&
          window.innerWidth >= minScreenWidth
        ) {
          // Reset saveButtonInfo is no longer needed as we hardcode it
          // saveButtonInfo = null;
          updateYouTubeUI();
        }
      }
    }, 1000); // Check every second
  }

  // Function to handle page navigation
  function handleNavigation() {
    // Reset saveButtonInfo is no longer needed as we hardcode it
    // saveButtonInfo = null;

    // Remove any existing custom Save button
    const customSaveButton = document.querySelector(".yt-save-button-mod");
    if (customSaveButton) {
      customSaveButton.remove();
    }

    // Update UI after a short delay to allow the page to load
    setTimeout(updateYouTubeUI, 500);
  }

  // Get settings from storage
  chrome.storage.sync.get(["minScreenWidth"], (result) => {
    // Use the same minScreenWidth setting as the columns feature if available
    if (result.minScreenWidth !== undefined) {
      minScreenWidth = result.minScreenWidth;
    }

    // Initial application of settings
    updateYouTubeUI();

    // Add resize event listener with debounce to improve performance
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateYouTubeUI();
      }, 100); // 100ms debounce
    });

    // Add mutation observer to handle dynamically loaded content
    const observer = new MutationObserver(handleMutations);

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });

    // Start periodic check for UI elements
    startPeriodicCheck();

    // Listen for URL changes (YouTube is a single-page application)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        handleNavigation();
      }
    }).observe(document, { subtree: true, childList: true });
  });
})();
