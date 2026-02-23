chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'COPY_IMAGE' || !message.arrayBuffer || !message.mimeType) return;

  (async () => {
    try {
      const blob = new Blob([message.arrayBuffer], { type: message.mimeType });
      await navigator.clipboard.write([
        new ClipboardItem({ [message.mimeType]: blob })
      ]);
      sendResponse({ ok: true });
    } catch (err) {
      console.error('Copy Slides: clipboard write failed', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true; // keep channel open for async sendResponse
});
