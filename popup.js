document.getElementById("save").addEventListener("click", () => {
  const columns = parseInt(document.getElementById("columns").value);
  const minScreenWidth = parseInt(
    document.getElementById("minScreenWidth").value
  );
  const hideShorts = document.getElementById("hideShorts").checked;
  const hideEndRecommendations = document.getElementById(
    "hideEndRecommendations"
  ).checked;

  if (columns >= 1 && columns <= 10) {
    if (minScreenWidth >= 0) {
      chrome.storage.sync.set(
        { columns, minScreenWidth, hideShorts, hideEndRecommendations },
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
  ["columns", "minScreenWidth", "hideShorts", "hideEndRecommendations"],
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
  }
);
