// Context menu for regular <img> (non-Slides)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copy-slides-image',
    title: 'Copy image to clipboard',
    contexts: ['image']
  });
  chrome.contextMenus.create({
    id: 'copy-slides-api',
    title: 'Copy image to clipboard (Slides)',
    contexts: ['all'],
    documentUrlPatterns: ['*://docs.google.com/presentation/*']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === 'copy-slides-api') {
    await handleSlidesCopy(tab);
    return;
  }

  if (info.menuItemId === 'copy-slides-image' && info.srcUrl) {
    await handleRegularImageCopy(tab, info.srcUrl);
  }
});

async function handleSlidesCopy(tab) {
  try {
    const sel = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SLIDES_SELECTION' });
    if (!sel?.deckId) {
      showToast(tab.id, 'Copy Slides: Could not get presentation ID from URL.');
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      showToast(tab.id, 'Copy Slides: Sign in with Google required.');
      return;
    }

    let { pageId, targetId, slideIndex } = sel;
    const deckId = sel.deckId;

    // Resolve pageId from slide index if we have deck but no pageId
    if (!pageId && slideIndex != null) {
      const presRes = await fetch(
        `https://slides.googleapis.com/v1/presentations/${deckId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (presRes.ok) {
        const pres = await presRes.json();
        const slides = pres.slides || [];
        if (slides[slideIndex]) pageId = slides[slideIndex].objectId;
      }
    }

    // If we have pageId but no targetId, use first image on that page; else try first image on first slide
    if (!targetId) {
      const fallback = pageId
        ? await resolveFirstImageOnPage(deckId, pageId, token)
        : await resolveFirstImage(deckId, token);
      if (fallback) {
        pageId = pageId || fallback.pageId;
        targetId = fallback.targetId;
      }
    }
    if (!pageId || !targetId) {
      showToast(tab.id, 'Copy Slides: Right-click an image on the slide, then try again.');
      return;
    }

    const pageRes = await fetch(
      `https://slides.googleapis.com/v1/presentations/${deckId}/pages/${pageId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!pageRes.ok) {
      const errText = await pageRes.text();
      throw new Error(`Slides API: ${pageRes.status} ${errText}`);
    }
    const pageData = await pageRes.json();
    const el = pageData.pageElements?.find((e) => e.objectId === targetId);
    const contentUrl = el?.image?.contentUrl;
    if (!contentUrl) {
      showToast(tab.id, 'Copy Slides: Selected element is not an image.');
      return;
    }

    const imgRes = await fetch(contentUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!imgRes.ok) throw new Error(`Image fetch: ${imgRes.status}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    const mimeType = imgRes.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';

    await chrome.tabs.sendMessage(tab.id, {
      type: 'COPY_IMAGE',
      arrayBuffer,
      mimeType
    });
    showToast(tab.id, 'Image copied to clipboard.', true);
  } catch (err) {
    console.error('Copy Slides (API):', err);
    showToast(tab.id, 'Copy Slides: ' + (err.message || 'Failed to copy image.'));
  }
}

async function resolveFirstImageOnPage(deckId, pageId, token) {
  const pageRes = await fetch(
    `https://slides.googleapis.com/v1/presentations/${deckId}/pages/${pageId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!pageRes.ok) return null;
  const pageData = await pageRes.json();
  const img = pageData.pageElements?.find((e) => e.image?.contentUrl);
  return img ? { pageId, targetId: img.objectId } : null;
}

async function resolveFirstImage(deckId, token) {
  const presRes = await fetch(
    `https://slides.googleapis.com/v1/presentations/${deckId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!presRes.ok) return null;
  const pres = await presRes.json();
  const slides = pres.slides || [];
  for (const slide of slides) {
    const found = await resolveFirstImageOnPage(deckId, slide.objectId, token);
    if (found) return found;
  }
  return null;
}

function getAuthToken() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Copy Slides identity:', chrome.runtime.lastError);
        resolve(null);
        return;
      }
      resolve(token);
    });
  });
}

async function handleRegularImageCopy(tab, srcUrl) {
  try {
    const response = await fetch(srcUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png';
    await chrome.tabs.sendMessage(tab.id, { type: 'COPY_IMAGE', arrayBuffer, mimeType });
  } catch (err) {
    console.error('Copy Slides: failed to fetch image', err);
    showToast(tab.id, 'Copy Slides: Could not copy image.');
  }
}

function showToast(tabId, text, isSuccess = false) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg, success) => {
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText =
        'position:fixed;bottom:16px;right:16px;padding:12px 16px;border-radius:8px;z-index:999999;font-family:sans-serif;font-size:13px;';
      el.style.background = success ? '#0a0' : '#c00';
      el.style.color = '#fff';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    },
    args: [text, isSuccess]
  }).catch(() => {});
}
