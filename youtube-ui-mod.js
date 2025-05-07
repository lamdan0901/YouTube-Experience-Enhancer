(function () {
  "use strict";

  // Configuration
  let minScreenWidth = 1440; // Default minimum screen width for UI modifications
  let saveButtonInfo = null; // Store information about the Save button
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

    // If we're applying modifications and the Save button doesn't exist yet, create it
    if (applyUIModifications) {
      if (!document.querySelector(".yt-save-button-mod")) {
        createSaveButton();
      }
    } else {
      // Remove the custom Save button if it exists and we're below the threshold
      const customSaveButton = document.querySelector(".yt-save-button-mod");
      if (customSaveButton) {
        customSaveButton.remove();
      }
    }
  }

  // Function to temporarily open the dropdown menu to access its contents
  function openAndAccessDropdown() {
    const menuButton = document.querySelector(
      "ytd-menu-renderer yt-button-shape"
    );
    if (!menuButton) return null;

    // Check if dropdown is already open
    let dropdown = document.querySelector(
      "tp-yt-iron-dropdown[aria-disabled='false']"
    );

    if (!dropdown) {
      // Click to open the dropdown
      menuButton.click();

      // Get the dropdown
      dropdown = document.querySelector(
        "tp-yt-iron-dropdown[aria-disabled='false']"
      );

      // If we successfully opened the dropdown, get the Save button info
      if (dropdown) {
        const saveInfo = getSaveButtonInfo();

        // Close the dropdown
        setTimeout(() => {
          menuButton.click();
        }, 50);

        return saveInfo;
      }
    } else {
      // Dropdown is already open, get the Save button info
      return getSaveButtonInfo();
    }

    return null;
  }

  // Function to get information about the Save button in the dropdown
  function getSaveButtonInfo() {
    const saveOptions = Array.from(
      document.querySelectorAll("tp-yt-paper-item")
    ).filter((item) => {
      const text = item.textContent.trim();
      return text === "Save";
    });

    if (saveOptions.length > 0) {
      const saveButton = saveOptions[0];
      const saveItem = saveButton.closest("ytd-menu-service-item-renderer");

      if (saveItem) {
        // Mark this element for hiding when our custom button is visible
        saveItem.classList.add("yt-dropdown-save-option");

        // Get the icon SVG
        const iconSvg =
          saveButton.querySelector("yt-icon svg")?.outerHTML ||
          `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M18 4v15.06l-5.42-3.87-.58-.42-.58.42L6 19.06V4h12m1-1H5v18l7-5 7 5V3z"></path></svg>`;

        return {
          element: saveButton,
          text: "Save",
          iconSvg: iconSvg,
        };
      }
    }

    return null;
  }

  // Function to create and add the Save button to the action buttons
  function createSaveButton() {
    // Find the actions container
    const actionsContainer = document.querySelector(
      "#top-level-buttons-computed"
    );
    if (!actionsContainer) return;

    // Hardcode Save button info
    const saveButtonInfo = {
      text: "Save",
      iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path d="M18 4v15.06l-5.42-3.87-.58-.42-.58.42L6 19.06V4h12m1-1H5v18l7-5 7 5V3z"></path></svg>`,
    };

    console.log("Attempting to create Save button...");
    // Create a new button element
    const saveButton = document.createElement("yt-button-view-model");
    saveButton.className = "ytd-menu-renderer yt-save-button-mod";
    saveButton.setAttribute("data-tooltip-text", "Save"); // Add tooltip

    // Copy the inner HTML structure from the Share button as a template
    const shareButton = document.querySelector(
      "#top-level-buttons-computed yt-button-view-model"
    );
    if (shareButton) {
      saveButton.innerHTML = shareButton.innerHTML;

      console.log("Share button found, copying structure.");
      // Update the button text and icon
      const buttonElement = saveButton.querySelector("button");
      if (buttonElement) {
        console.log("Button element found, updating attributes and content.");
        // Update button title and aria-label
        buttonElement.title = "Save";
        buttonElement.setAttribute("aria-label", "Save this video");
        buttonElement.setAttribute("data-tooltip-text", "Save"); // Add tooltip to the inner button as well

        // Update the icon
        const iconContainer = buttonElement.querySelector(
          ".yt-spec-button-shape-next__icon div"
        );
        if (iconContainer) {
          iconContainer.innerHTML = saveButtonInfo.iconSvg;
        }

        // Update the button text
        const textContent = buttonElement.querySelector(
          ".yt-spec-button-shape-next__button-text-content"
        );
        if (textContent) {
          textContent.textContent = "Save";
        }

        // Add click event listener
        buttonElement.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Open the dropdown menu
          const menuButton = document.querySelector(
            "ytd-menu-renderer yt-button-shape"
          );
          if (menuButton) {
            menuButton.click();

            // Wait for the dropdown to open and then click the Save button
            setTimeout(() => {
              // Find the Save button in the dropdown
              const saveButtons = Array.from(
                document.querySelectorAll("tp-yt-paper-item")
              ).filter((item) => item.textContent.trim() === "Save");
              const saveButton = saveButtons.length > 0 ? saveButtons[0] : null;
              if (saveButton) {
                saveButton.click();
              } else {
                // Close the dropdown if we couldn't find the Save button
                menuButton.click();
              }
            }, 100);
          }
        });
      }

      // Add the button to the actions container
      actionsContainer.appendChild(saveButton);
      console.log("Save button created and added.");
    } else {
      console.log("Share button not found, cannot create Save button.");
    }
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
