(function() {
  const cfg = {
    songTitle: 'My New Song',
    lyricsText: `Write a song about following your dreams and never giving up
Make it uplifting and motivational
Include verses and chorus structure`,
    stylesToAdd: ['Pop', 'Upbeat', 'Inspirational'],
    observeMs: 15 * 60 * 1000,
    waitBetweenStyleMs: 250,
    downloadLyrics: true,
    maxRetries: 30,
    retryInterval: 2000
  };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function setReactValue(el, value) {
    if (!el) return;
    try {
      const tag = el.tagName;
      if (tag === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
        if (setter && setter.set) {
          setter.set.call(el, value);
        } else {
          el.value = value;
        }
      } else if (tag === 'INPUT') {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        if (setter && setter.set) {
          setter.set.call(el, value);
        } else {
          el.value = value;
        }
      } else {
        el.innerText = value;
      }
    } catch (e) {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function clickByTextContains(txt) {
    const t = txt.toLowerCase();
    const els = Array.from(document.querySelectorAll('button,[role="button"],a'));
    const found = els.find(b => {
      const text = b.textContent || '';
      return text.trim().toLowerCase().includes(t);
    });
    if (found) { 
      found.click(); 
      return true; 
    }
    return false;
  }

  async function addStylesAsChips(inputEl, styles) {
    inputEl.focus();
    for (const s of styles) {
      setReactValue(inputEl, s);
      const enterEvent = new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter', 
        keyCode: 13, 
        which: 13, 
        bubbles: true 
      });
      inputEl.dispatchEvent(enterEvent);
      await sleep(cfg.waitBetweenStyleMs);
    }
  }

  function getLyricsEl() {
    const selectors = [
      'span.whitespace-pre-wrap',
      '[data-testid*="lyrics"]',
      '.lyrics-container',
      '.song-lyrics',
      'div[class*="lyrics"]',
      'span[class*="lyrics"]'
    ];

    for (const selector of selectors) {
      try {
        const el = document.querySelector(selector);
        if (el && el.innerText && el.innerText.trim().length > 50) {
          return el;
        }
      } catch (e) {
        continue;
      }
    }

    const allSpans = document.querySelectorAll('span, div, p');
    for (const span of allSpans) {
      try {
        const text = span.innerText;
        if (text && text.trim().length > 100 && 
            (text.includes('Verse') || text.includes('Chorus') || text.includes('\n\n'))) {
          return span;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  }

  function getCreateBtn() {
    const createBtns = Array.from(document.querySelectorAll('button,[role="button"]'));
    return createBtns.find(b => {
      const text = b.textContent || '';
      return text.trim().toLowerCase() === 'create';
    });
  }

  function getPublishBtn() {
    const publishBtns = Array.from(document.querySelectorAll('button,[role="button"]'));
    return publishBtns.find(b => {
      const text = b.textContent || '';
      return text.trim().toLowerCase().includes('publish');
    });
  }

  function closeSettingsModalIfOpen() {
    const closeSelectors = [
      'div[role="dialog"] button[aria-label="Close"]',
      'div[role="dialog"] button[aria-label="close"]'
    ];
    
    for (const selector of closeSelectors) {
      const closeBtn = document.querySelector(selector);
      if (closeBtn) {
        closeBtn.click();
        console.log('Settings modal closed.');
        return;
      }
    }

    const xBtns = Array.from(document.querySelectorAll('button'));
    const xBtn = xBtns.find(b => b.textContent && b.textContent.trim() === '×');
    if (xBtn) {
      xBtn.click();
      console.log('Settings modal closed.');
    }
  }

  function downloadLyrics(lyrics, filename) {
    try {
      const blob = new Blob([lyrics], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || cfg.songTitle.replace(/[^a-z0-9]/gi, '_') + '_lyrics.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Lyrics downloaded:', a.download);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }

  function expandLyricsPanel() {
    const buttons = Array.from(document.querySelectorAll('button'));
    buttons.forEach(btn => {
      try {
        const label = btn.getAttribute('aria-label') || '';
        const text = btn.textContent || '';
        if (label.toLowerCase().includes('lyrics') || 
            text.toLowerCase().includes('lyrics') ||
            text.toLowerCase().includes('expand')) {
          btn.click();
        }
      } catch (e) {
        // Ignore click errors
      }
    });
  }

  // ========= MAIN EXECUTION =========
  async function main() {
    try {
      console.log('Starting Suno.AI automation script...');
      
      await sleep(1000);
      clickByTextContains('More Options');
      clickByTextContains('Advanced Options');
      expandLyricsPanel();

      // Song title
      const titleInput = document.querySelector('input[placeholder*="song title"], input[placeholder*="Enter song title"], input[aria-label*="Song Title"]');
      if (titleInput) {
        setReactValue(titleInput, cfg.songTitle);
        console.log('Title set:', cfg.songTitle);
      } else {
        console.warn('Song title input not found.');
      }

      // Styles
      const stylesInput = document.querySelector('input[placeholder*="Enter style tags"], textarea[placeholder*="Enter style tags"]');
      if (stylesInput) {
        await addStylesAsChips(stylesInput, cfg.stylesToAdd);
        console.log('Styles added:', cfg.stylesToAdd.join(', '));
      } else {
        console.warn('Styles input not found.');
      }

      const lyricsInput = document.querySelector('textarea[placeholder*="Write your lyrics"], textarea[placeholder*="Add your own lyrics"], textarea[data-testid*="lyrics"]');
      if (lyricsInput) {
        setReactValue(lyricsInput, cfg.lyricsText);
        console.log('Lyrics inserted.');
      } else {
        console.warn('Lyrics textarea not found.');
      }

      await sleep(500);
      closeSettingsModalIfOpen();

      // Click create
      const createBtn = getCreateBtn();
      if (createBtn) { 
        createBtn.click(); 
        console.log('Create button clicked - Song generation started!');
      } else { 
        console.warn('Create button not found.'); 
        return;
      }

      await sleep(3000);

      // Monitor for results
      let foundLyrics = false;
      let publishBtnFound = false;
      let retries = 0;

      const monitor = setInterval(() => {
        expandLyricsPanel();

        // Check for lyrics
        if (!foundLyrics && retries < cfg.maxRetries) {
          const lyricsEl = getLyricsEl();
          if (lyricsEl) {
            const currentLyrics = lyricsEl.innerText.trim();
            if (currentLyrics && currentLyrics.length > 50) {
              foundLyrics = true;
              console.log('Generated Lyrics Found:');
              console.log('='.repeat(50));
              console.log(currentLyrics);
              console.log('='.repeat(50));
              
              if (cfg.downloadLyrics) {
                downloadLyrics(currentLyrics);
              }
            }
          }
          retries++;
          if (!foundLyrics) {
            console.log('Retry ' + retries + '/' + cfg.maxRetries + ' - Looking for lyrics...');
          }
        }

        // Check for publish button
        const publishBtn = getPublishBtn();
        if (publishBtn && !publishBtnFound) {
          publishBtnFound = true;
          console.log('Song generation complete! Publish button is available.');
        }

        if (foundLyrics && publishBtnFound) {
          clearInterval(monitor);
          console.log('Script completed successfully!');
        }
      }, cfg.retryInterval);

      setTimeout(() => {
        clearInterval(monitor);
        console.log('Monitoring stopped after timeout.');
      }, cfg.observeMs);

    } catch (error) {
      console.error('Script error:', error);
    }
  }

  // Start the script
  main();
})();