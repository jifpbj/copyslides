# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Copy Slides is a Chrome extension (Manifest V3) that copies images to the clipboard from any website, with special handling for Google Slides using the Slides API.

## Development Setup

No build process. Load the extension directly:
1. Open `chrome://extensions/` and enable **Developer mode**
2. Click **Load unpacked** and select this directory
3. After any file change, click the reload button on the extension card

For Google Slides functionality, `manifest.json` requires a real OAuth2 client ID in place of `YOUR_CLIENT_ID.apps.googleusercontent.com`. Set this up via Google Cloud Console: enable the Slides API, create an OAuth client for a Chrome extension, and register the extension ID.

## Architecture

The extension has three JavaScript files and no external dependencies:

- **`background.js`** (service worker) — all business logic lives here. Creates context menu items, handles clicks, queries the Google Slides API, fetches image blobs, and orchestrates the other two scripts via `chrome.scripting` / `chrome.tabs.sendMessage`.

- **`content-slides.js`** (runs only on `docs.google.com/presentation/*`) — tracks the last right-clicked element, extracts `deckId` from the URL path, `pageId` from the URL hash, and `targetId` by walking the DOM for data attributes (`data-object-id`, `data-shape-id`, etc.). Responds to `GET_SLIDES_SELECTION` messages from the background worker.

- **`content.js`** (runs on all pages) — receives `COPY_IMAGE` messages with an `ArrayBuffer` + `mimeType`, constructs a `Blob`, and writes it to the clipboard via `navigator.clipboard.write`.

### Slides API flow

```
Right-click → context menu → background.js
  → sendMessage GET_SLIDES_SELECTION → content-slides.js returns { deckId, pageId, targetId, slideIndex }
  → getAuthToken() via chrome.identity
  → GET /v1/presentations/{deckId}/pages/{pageId}  (find image contentUrl)
  → fetch(contentUrl) with Bearer token → ArrayBuffer
  → sendMessage COPY_IMAGE → content.js writes clipboard
  → showToast() injects temporary notification
```

Fallback chain when element/page ID is missing: try resolving the first image on the current page, then scan all slides for the first image.

### Regular image flow

Right-click → context menu → `handleRegularImageCopy()` in background.js fetches `info.srcUrl` directly (no auth) → sends `COPY_IMAGE` to content.js.
