# Content Companion Fix Plan

## Problem Found

Browser verification showed that the cat system was implemented but not practically visible on long markdown pages.

The first real screenshot check of `/#/about-me` showed:

- no visible cat
- no visible platforms
- no visible portal

## Root Cause Hypothesis

The companion layer is currently tied to the content-page document layout instead of the active viewport.

That creates two failure modes on long pages:

1. The initial shelf can spawn far below the visible viewport because the scene height follows the full page height.
2. The central forbidden block is measured in document flow terms, while the desired visual behavior should be anchored to what the user actually sees on screen.

## Goal Of The Fix

Move the companion system from document-height coordinates to viewport-relative coordinates, so the cat is always visible around the currently visible content panel.

## Planned Changes

### 1. Re-anchor the companion to the viewport

- Make the cat layer fixed to the visible viewport area below the header
- Use viewport width and viewport height instead of content-page total height
- Keep the header visually above the cat layer

### 2. Measure the markdown panel in viewport coordinates

- Measure the content panel with `getBoundingClientRect()`
- Measure the sticky header height
- Convert the panel rectangle into coordinates relative to the viewport area below the header

### 3. Update content-page measurement logic

- Stop using the content-page host element height as the scene height
- Use `window.innerWidth` and `window.innerHeight - headerHeight`
- Recompute on:
  - resize
  - scroll
  - panel resize

### 4. Keep companion visuals inside the visible frame

- Constrain shelf generation to the viewport scene only
- Ensure the initial shelf is always visible
- Ensure the cat and platforms do not spawn under the header

### 5. Re-run browser verification

Verify in a real screenshot pass that:

- the cat is visible on non-home pages
- the cat is outside the text panel
- the cat is readable as a pixel cat
- at least one platform is visible

### 6. If still wrong, do one more tuning loop

If the cat is visible but still weak, adjust:

- cat render size
- shelf placement bias
- preferred left/right zone spawning
- scene top/bottom margins

## Acceptance Criteria

- the cat is immediately visible on `About Me`
- the cat is outside the markdown panel
- the cat is not hidden behind the header
- the cat is small but readable
- at least one shelf is visible at load
