# Copy Slides

**Chromium extension** (Manifest V3) that copies images to the clipboard. On **Google Slides** it uses the Slides API to get the original image (so it works even when the slide doesn’t use a plain `<img>`). On other sites it copies the image from the context menu.

Works in Chrome, Chromium, Edge, **Brave**, Opera, etc.

## Google Slides (recommended on Brave)

1. Open a presentation at `docs.google.com/presentation/...`
2. Right-click on the slide (or on an image).
3. Choose **Copy image to clipboard (Slides)**.
4. The extension uses your Google account and the Slides API to fetch the image’s `contentUrl`, then copies it to the clipboard.
5. Paste (Ctrl+V / Cmd+V) where you need it.

If the exact element isn’t detected, the extension falls back to the first image on the current slide (or the first slide).

## Other sites

Right-click an image and choose **Copy image to clipboard** to copy it (no Google sign-in).

## Setup: Google OAuth (required for Slides)

To use **Copy image to clipboard (Slides)** you must create a Chrome extension OAuth client and put its ID in the manifest.

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services → Library** → enable **Google Slides API**.
4. **APIs & Services → Credentials** → **Create credentials** → **OAuth client ID**.
5. Application type: **Chrome extension** (or **Chrome app**).
6. Under **Application ID**, paste your extension ID:
   - Load the extension once (Load unpacked), then open `chrome://extensions/` (or `brave://extensions/`), find “Copy Slides”, and copy the **ID** (e.g. `abcdefghijklmnop`).
7. Create the client and copy the **Client ID** (e.g. `123...abc.apps.googleusercontent.com`).
8. In this project, open `manifest.json` and replace `YOUR_CLIENT_ID` in the `oauth2.client_id` value with that Client ID.
9. Reload the extension.

## Install

1. Open your browser’s extensions page:
   - Chrome/Chromium: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`copy_slides`).
4. (For Slides) Complete the OAuth setup above and reload the extension.

## Files

- `manifest.json` – Manifest V3; permissions and OAuth2 config.
- `background.js` – Context menus, Slides API calls, token, fetch image blob, send to tab for clipboard.
- `content.js` – Writes image blob to clipboard (all sites).
- `content-slides.js` – On Slides only: captures right-click target and resolves deckId / pageId / targetId (or slide index) for the API.
