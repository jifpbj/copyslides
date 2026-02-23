chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-slides-image',
    title: 'Copy image to clipboard',
    contexts: ['image']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'copy-slides-image' || !info.srcUrl || !tab?.id) return;

  try {
    const response = await fetch(info.srcUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';

    await chrome.tabs.sendMessage(tab.id, {
      type: 'COPY_IMAGE',
      arrayBuffer,
      mimeType
    });
  } catch (err) {
    console.error('Copy Slides: failed to fetch image', err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (url) => {
          const msg = document.createElement('div');
          msg.textContent = 'Copy Slides: Could not copy image (e.g. CORS or network error).';
          msg.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:12px 16px;background:#c00;color:#fff;border-radius:8px;z-index:999999;font-family:sans-serif;font-size:13px;';
          document.body.appendChild(msg);
          setTimeout(() => msg.remove(), 4000);
        },
        args: [info.srcUrl]
      });
    } catch (_) {}
  }
});
