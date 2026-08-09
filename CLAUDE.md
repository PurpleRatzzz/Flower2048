# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

「花漾 2048」— a flower-themed 2048 game. Zero dependencies, zero build step: three static files (`index.html`, `style.css`, `game.js`) plus `assets/favicon.svg`. All UI copy is Simplified Chinese.

## Running

```bash
open index.html                 # file:// works — nothing is fetched over the network
python3 -m http.server 8000     # only needed if a file:// restriction bites
```

There is no package.json, no linter, no test suite. Verification is manual in a browser.

## Architecture

`game.js` is a single top-level script (no modules, no classes). Module-level `let` bindings *are* the game state — `board` (flat 16-element array, index = `row * 4 + col`), `score`, `discovered`, `previous`, `toolCounts`, `activeTool`, `selectedIndex`. Every mutation path ends with the same trio: mutate state → `render()` → `saveGame()`.

**`render()` is a full teardown.** It wipes `tilesEl.innerHTML` and rebuilds every tile from `board`. There is no diffing and no per-tile identity, so tiles cannot slide between cells — movement reads as an instant re-layout, and the only motion is CSS keyframes on freshly created elements (`tileAppear`, plus `tileMerge` on tiles whose value matches `window.lastMergedValue`). Pass `render({ animateTiles: false })` for state changes that shouldn't re-pop the whole board (undo, tool use, toggles). Any change to move animation has to confront this rebuild model first.

**Tile positioning is CSS-driven.** JS only sets `--row` / `--col` custom properties; `style.css` computes absolute `left`/`top` from `--cell` and `--board-gap`. Keep grid geometry in CSS — don't compute pixel offsets in JS.

**Flowers are the value ladder.** `FLOWERS` (top of `game.js`) is the ordered list of the 17 tile values, 2 → 131072, each with `name`, `bg`, `ink`, and a `kind` discriminator. `flowerSvg()` is a chain of `if (flower.kind === ...)` branches emitting inline SVG path strings; `petals()` and `radialPetals()` generate rotated petal rings. Adding a tier means appending to `FLOWERS` *and* adding a `kind` branch — a missing branch renders a bare stem, not an error. The win condition, the modal, and the catalog all derive from `FLOWERS.at(-1)`, so the ladder length is the only place the goal is defined.

**Move logic** (`move()`): `LINES[direction]` (precomputed from `getLines()`) is 4 arrays of board indices already ordered in the direction of travel, so the merge loop is direction-agnostic — compact non-zero values, merge equal adjacent pairs once, pad with zeros, write back. Undo snapshots the pre-move state into `previous` (single level only; cleared after use).

**`checkOutcome()` is the only win/lose judge**, and every state mutation must call it — moves (including no-op moves, since a dead board produces no change), tool use, tidy, and page load. Win is reachable without a move at all (the upgrade tool can produce 昙花), and a tool can kill the last available merge, so gating the check on "a move happened" silently strands the player. It debounces via `outcomeTimer`, which `newGame()`/`undo()` clear.

**Tools are config-driven.** `TOOLS` (top of `game.js`) is the single source of truth: id, label, tooltip, starting count, icon path, result message, and a `target` that decides the input mode — `tile` (one tap), `pair` (two taps, uses `selectedIndex`), or `board` (instant, runs `tool.run()`). The shelf buttons, `render()`'s labels and counts, the status hints, and the initial counts are all derived from it, so adding or removing a tool means editing this array and nothing else. `makeToolCounts(saved)` is the only place counts are created — it backfills tools missing from an old save, drops tools no longer in `TOOLS`, and rejects non-numeric/negative junk. `grantTool(id, amount)` (also on `window`) is the mutation path for recharges, rewards, or deductions.

For `tile` / `pair` tools, `activeTool` puts tiles into a clickable state and `useToolOnTile()` applies the effect on the next tap (`tilesEl` pointer handlers swallow the event so board-swipe handlers don't also fire). Every tool snapshots `previous` before mutating, so undo covers all of them.

**Persistence**: three `localStorage` keys — `flower2048-save` (board/score/discovered/won/toolCounts), `flower2048-best`, `flower2048-sound`. `loadGame()` validates the board shape and cell types and falls through to a fresh game on anything malformed. `won` means "the win modal already fired this garden" — don't re-derive it from the board contents, or continuing past 昙花 and reloading re-fires it.

**Render caching**: `flowerSvg()` memoizes per tile value (`svgCache`), `renderCollection()` skips rebuilding unless the unlocked/current set changes (`collectionKey`), and the full catalog builds once. Without these, every `render()` — including tool-button toggles — regenerated 17+ inline SVGs.

**Audio** is fully synthesized via Web Audio — no files. Ambient loop is a `setInterval` walking `MUSIC_NOTES`, started lazily on the first move (autoplay policy) and stopped on `visibilitychange`.

## Gotchas

- `window.lastMergedValue` is a global used as a one-shot flag passed from `move()` into the next `render()`, which clears it. It is not part of saved state.
- `TIDY_ORDER` is the 整理 tool's fill sequence: a boustrophedon (snake) path, so consecutive ranks land on adjacent cells. Partial boards fill its *tail*, which keeps the largest tile at index 15. Reordering it silently changes game feel — merges depend on adjacency.
- Merging two 昙花 (the top tier) yields 262144, which has no `FLOWERS` entry; `flowerFor()` falls back to 昙花, so two different values render identically. Rare, and currently accepted.
- The tile-name font and board sizing rely on `clamp()`/`aspect-ratio`; responsive tuning lives in the `@media (max-width: 620px)` and `(max-height: 740px)` blocks near the end of `style.css`.
