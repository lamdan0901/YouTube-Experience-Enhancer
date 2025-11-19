// Toggle skip percentage dropdown visibility
document.getElementById("autoSkip").addEventListener("change", (e) => {
  const container = document.getElementById("skipPercentageContainer");
  container.style.display = e.target.checked ? "block" : "none";
});

document.getElementById("save").addEventListener("click", () => {
  const columns = parseInt(document.getElementById("columns").value);
  const minScreenWidth = parseInt(
    document.getElementById("minScreenWidth").value
  );
  const hideShorts = document.getElementById("hideShorts").checked;
  const hideEndRecommendations = document.getElementById(
    "hideEndRecommendations"
  ).checked;
  const autoSkip = document.getElementById("autoSkip").checked;
  const skipPercentage = parseInt(
    document.getElementById("skipPercentage").value
  );

  if (columns >= 1 && columns <= 10) {
    if (minScreenWidth >= 0) {
      chrome.storage.sync.set(
        {
          columns,
          minScreenWidth,
          hideShorts,
          hideEndRecommendations,
          autoSkip,
          skipPercentage,
        },
        () => {
          window.close();
        }
      );
    } else {
      alert("Please enter a valid minimum screen width (0 or greater).");
    }
  } else {
    alert("Please enter a number between 1 and 10 for columns.");
  }
});

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
    if (result.columns) {
      document.getElementById("columns").value = result.columns;
    }
    if (result.minScreenWidth !== undefined) {
      document.getElementById("minScreenWidth").value = result.minScreenWidth;
    }
    document.getElementById("hideShorts").checked = result.hideShorts || false;
    document.getElementById("hideEndRecommendations").checked =
      result.hideEndRecommendations || false;
    document.getElementById("autoSkip").checked = result.autoSkip || false;
    document.getElementById("skipPercentage").value =
      result.skipPercentage || 10;

    // Show/hide skip percentage dropdown based on autoSkip state
    const container = document.getElementById("skipPercentageContainer");
    container.style.display = result.autoSkip ? "block" : "none";
  }
);
