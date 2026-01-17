# Repository Guidelines

## Project Structure & Module Organization

- `manifest.json` defines the MV3 extension entry points, permissions, and content scripts.
- Content scripts and UI logic live in the repo root: `content.js`, `playlist-resize.js`, `keyboard-shortcuts.js`, `tooltip.js`, `youtube-ui-mod.js`.
- Popup UI is `popup.html` + `popup.js` with styling in `styles.css`.
- Shared styling for YouTube pages is in `youtube-ui-mod.css`.
- Extension assets live in `icons/`.

## Build, Test, and Development Commands

This project is a plain MV3 browser extension with no build step.

- Load unpacked: open `chrome://extensions/`, enable Developer Mode, click “Load unpacked”, select the repo folder.
- Reload during development: click the extension’s “Reload” button in the extensions page after changing files.
- Optional quick check: open a YouTube page and verify the column count/playlist resize/shortcuts.

## Coding Style & Naming Conventions

- JavaScript uses 2-space indentation, semicolons, and double quotes (see `content.js`).
- Prefer small, single-purpose modules; new behaviors should be in their own file and added to `manifest.json`.
- Use descriptive function names (e.g., `updateColumnSettings`, `setupAutoSkip`).

## Testing Guidelines

- No automated tests or test framework are configured.
- When changing behavior, verify in a live YouTube page and check both the popup and content-script features.

## Commit & Pull Request Guidelines

- Follow the existing Conventional Commit style: `feat: …`, `refactor: …`, `fix: …`.
- Keep commits focused and scoped to a single feature or bug.
- PRs should include: a brief summary, steps to verify, and screenshots or short clips for UI changes.

## Configuration & Security Notes

- All user preferences are stored via `chrome.storage.sync` and should be backward compatible.
- Avoid adding new permissions to `manifest.json` unless required; document any change in the PR.