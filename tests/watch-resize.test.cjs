const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const source = readFileSync(join(__dirname, "../watch-resize.js"), "utf8");

function start(local, legacy) {
  const result = { writes: [], syncReads: 0 };
  runInNewContext(source, {
    chrome: {
      runtime: {},
      storage: {
        local: {
          get: (keys, callback) => callback(local),
          set: (value, callback) => {
            result.writes.push(JSON.parse(JSON.stringify(value)));
            callback();
          },
        },
        sync: {
          get: (keys, callback) => {
            result.syncReads++;
            callback(legacy);
          },
        },
      },
    },
    document: { body: {}, querySelector: () => null, addEventListener() {} },
    window: { addEventListener() {} },
    MutationObserver: class { observe() {} },
  });
  return result;
}

test("migrates the previous synced pixel width into local storage", () => {
  assert.deepEqual(start({}, { playlistWidth: "267.5px" }).writes,
    [{ watchLayout: { playlistWidth: 267.5 } }]);
});

test("local sizes take precedence over the previous synced width", () => {
  const result = start({ watchLayout: { playlistWidth: 450, playerHeight: 500 } }, { playlistWidth: "300px" });
  assert.equal(result.syncReads, 0);
  assert.deepEqual(result.writes, []);
});

test("missing and malformed legacy widths do not become saved dimensions", () => {
  for (const value of [undefined, "200px; color:red", "NaNpx", -50, 0]) {
    assert.deepEqual(start({}, { playlistWidth: value }).writes, []);
  }
});
