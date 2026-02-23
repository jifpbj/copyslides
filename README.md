# Copy Slides

**Chromium extension** (Manifest V3): right-click any image (e.g. in Google Slides, PowerPoint Online, or any webpage) and choose **Copy image to clipboard** to copy the image.

Works in any Chromium-based browser: Chrome, Chromium, Edge, Brave, Opera, Vivaldi, etc.

## Install

1. Open your Chromium-based browser and go to the extensions page:
   - **Chrome/Chromium:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
   - **Brave:** `brave://extensions/`
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder (`copy_slides`).
4. The extension will appear in your extensions list.

## Use

1. Open any page with images (e.g. Google Slides).
2. Right-click the image you want to copy.
3. Click **Copy image to clipboard** in the context menu.
4. Paste (Ctrl+V / Cmd+V) into Docs, Slides, or any app that accepts images.

## Files

- `manifest.json` – Extension manifest (Manifest V3).
- `background.js` – Service worker: adds the context menu and fetches the image when you click it.
- `content.js` – Runs in the page and writes the image to the clipboard (required for clipboard API).
