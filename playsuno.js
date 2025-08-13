(async function() {
  const cfg = {
    songTitle: 'My New Song',
    lyricsText: `Write a song about following your dreams and never giving up
Make it uplifting and motivational
Include verses and chorus structure`,
    stylesToAdd: ['Pop', 'Upbeat', 'Inspirational'],
    waitBetweenStyleMs: 250
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function setReactValue(el, value) {
    if (!el) return;
    const tag = el.tagName;
    try {
      if (tag === 'TEXTAREA') {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set?.call(el, value) || (el.value = value);
      } else if (tag === 'INPUT') {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, value) || (el.value = value);
      } else el.innerText = value;
    } catch {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function addStylesAsChips(inputEl, styles) {
    inputEl.focus();
    for (const s of styles) {
      setReactValue(inputEl, s);
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      console.log('Added style:', s);
      await sleep(cfg.waitBetweenStyleMs);
    }
  }

  function clickByTextContains(txt) {
    const t = txt.toLowerCase();
    const els = Array.from(document.querySelectorAll('button,[role="button"],a'));
    const found = els.find(b => (b.textContent || '').trim().toLowerCase().includes(t));
    if (found) {
      found.click();
      console.log(Clicked button containing: ${txt});
    }
    return !!found;
  }

  async function downloadFile(url, filename) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('Download triggered for:', filename);
      return true;
    } catch (e) {
      console.error('Failed to download:', e);
      return false;
    }
  }

  function expandLyricsPanel() {
    clickByTextContains('Show Lyrics');
    clickByTextContains('Expand Lyrics');
    console.log('Attempted to expand lyrics panel');
  }

  function setupLyricsObserver() {
    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const text = node.innerText || '';
            if (text.length > 100 && (text.includes('Verse') || text.includes('Chorus'))) {
              console.log('Lyrics detected via MutationObserver');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = cfg.songTitle.replace(/[^a-z0-9]/gi, '_') + '_lyrics.txt';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              observer.disconnect();
              console.log('Lyrics downloaded');
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setupAudioObserver() {
    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            let audioUrl = null;
            if (node.tagName === 'A' && node.href.match(/\.(mp3|wav|m4a|ogg|aac)$/i)) audioUrl = node.href;
            if (node.tagName === 'A' && node.hasAttribute('download')) audioUrl = node.href;
            const audioEl = node.querySelector ? node.querySelector('audio') : null;
            if (audioEl?.src) audioUrl = audioEl.src;
            if (audioEl?.currentSrc) audioUrl = audioEl.currentSrc;
            if (audioUrl) {
              downloadFile(audioUrl, cfg.songTitle.replace(/[^a-z0-9]/gi, '_') + '.mp3');
              observer.disconnect();
              console.log('Song downloaded via MutationObserver');
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- Main Execution ---
  await sleep(1000);
  clickByTextContains('More Options');
  clickByTextContains('Advanced Options');
  expandLyricsPanel();

  const titleInput = document.querySelector('input[placeholder*="song title"], input[aria-label*="Song Title"]');
  if (titleInput) {
    setReactValue(titleInput, cfg.songTitle);
    console.log('Title set:', cfg.songTitle);
  }

  const stylesInput = document.querySelector('input[placeholder*="Enter style tags"], textarea[placeholder*="Enter style tags"]');
  if (stylesInput) await addStylesAsChips(stylesInput, cfg.stylesToAdd);

  const lyricsInput = document.querySelector('textarea[placeholder*="Write your lyrics"], textarea[data-testid*="lyrics"]');
  if (lyricsInput) {
    setReactValue(lyricsInput, cfg.lyricsText);
    console.log('Lyrics prompt set');
  }

  const createBtn = Array.from(document.querySelectorAll('button,[role="button"]'))
                         .find(b => (b.textContent || '').trim().toLowerCase() === 'create');
  if (createBtn) {
    createBtn.click();
    console.log('Clicked Create button');
  }

  // Setup MutationObservers
  setupLyricsObserver();
  setupAudioObserver();

  console.log('Observers set up. Waiting for lyrics and song...');
})();