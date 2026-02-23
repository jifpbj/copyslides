/**
 * Runs only on docs.google.com/presentation.
 * Captures right-click target and tries to resolve deckId, pageId, targetId for the Slides API.
 */

let lastRightClickTarget = null;

document.addEventListener(
  'contextmenu',
  (e) => {
    lastRightClickTarget = e.target;
  },
  true
);

function getDeckId() {
  const m = window.location.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function getPageIdFromHash() {
  const hash = window.location.hash || '';
  // e.g. #slide=id.p or #slide=id.abc123
  const m = hash.match(/#slide=id\.(.+)/);
  return m ? m[1] : null;
}

function findDataAttr(el, names) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    for (const name of names) {
      const val = n.getAttribute?.(name);
      if (val) return val;
    }
  }
  return null;
}

function getCurrentSlideIndex() {
  // Thumbnail strip: look for selected/active slide index (number)
  const selected = document.querySelector(
    '.punch-filmstrip-thumbnail-selected, [aria-selected="true"], [data-slide-index]'
  );
  if (selected) {
    const idx =
      selected.getAttribute('data-index') ??
      selected.getAttribute('data-slide-index');
    if (idx != null && idx !== '') return parseInt(idx, 10);
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'GET_SLIDES_SELECTION') return;

  const deckId = getDeckId();
  if (!deckId) {
    sendResponse({ deckId: null });
    return;
  }

  let pageId = getPageIdFromHash();
  let targetId = null;

  if (lastRightClickTarget) {
    targetId =
      findDataAttr(lastRightClickTarget, [
        'data-object-id',
        'data-shape-id',
        'data-id',
        'data-element-id',
        'data-objectid'
      ]) || null;
    if (!pageId) {
      const pageIdFromEl = findDataAttr(lastRightClickTarget, ['data-page-id', 'data-slide-id']);
      if (pageIdFromEl) pageId = pageIdFromEl;
    }
  }

  sendResponse({
    deckId,
    pageId: pageId || undefined,
    targetId: targetId || undefined,
    slideIndex: getCurrentSlideIndex()
  });
});
