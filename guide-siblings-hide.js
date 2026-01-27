(function () {
  "use strict";

  const TARGET_SELECTOR = "ytd-guide-collapsible-section-entry-renderer";
  const HIDDEN_ATTR = "data-yee-hidden-guide-sibling";

  function hideSiblingsForTarget(target) {
    if (!target || !target.parentElement) return;

    Array.from(target.parentElement.children).forEach((sibling) => {
      if (sibling === target) return;
      if (sibling.getAttribute(HIDDEN_ATTR) === "true") return;
      sibling.setAttribute(HIDDEN_ATTR, "true");
      sibling.style.display = "none";
    });
  }

  function applyGuideSiblingHide() {
    const targets = document.querySelectorAll(TARGET_SELECTOR);
    targets.forEach(hideSiblingsForTarget);
  }

  function startObserver() {
    applyGuideSiblingHide();
    const observer = new MutationObserver(() => {
      applyGuideSiblingHide();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, {
      once: true,
    });
  } else {
    startObserver();
  }
})();
