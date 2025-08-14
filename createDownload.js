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
    downloadMP3: true, // New option to enable MP3 download
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

  // NEW: Highly specific function to find the exact three-dot menus from your workspace
  function getThreeDotMenus() {
    console.log(' Searching for workspace song three-dot menus...');
    
    const menus = [];
    
    // Look for all buttons that contain the vertical three-dot symbol (⋮)
    const allButtons = document.querySelectorAll('button');
    
    Array.from(allButtons).forEach((btn, index) => {
      const text = btn.textContent || '';
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const innerHTML = btn.innerHTML || '';
      
      // Look for the exact three-dot symbol from your screenshot: ⋮
      if (text.includes('⋮') || text.includes('⋯') || text.includes('...')) {
        console.log(`Found three-dot button ${index}:`, btn);
        console.log(`Button text: "${text}"`);
        console.log(`Button aria-label: "${ariaLabel}"`);
        
        // Check if this button is near a song by looking at its parent container
        let parent = btn.closest('div');
        let foundSongContext = false;
        
        for (let i = 0; i < 5 && parent; i++) {
          const parentText = parent.textContent || '';
          
          // Look for song indicators: title, duration, "Publish" status
          if (parentText.includes('My New Song') && 
              (parentText.includes('Publish') || parentText.match(/\d+:\d+/))) {
            foundSongContext = true;
            console.log(` Button is in song context - adding to menu list`);
            break;
          }
          parent = parent.parentElement;
        }
        
        if (foundSongContext) {
          menus.push(btn);
        } else {
          console.log(` Button not in song context - skipping`);
        }
      }
      
      // Also look for buttons with "More Actions" or similar labels specifically on song cards
      if (ariaLabel.toLowerCase().includes('more actions') || 
          ariaLabel.toLowerCase().includes('menu')) {
        
        let parent = btn.closest('div');
        for (let i = 0; i < 5 && parent; i++) {
          const parentText = parent.textContent || '';
          if (parentText.includes('My New Song') && 
              (parentText.includes('Publish') || parentText.match(/\d+:\d+/))) {
            console.log(` Found "More Actions" button in song context:`, btn);
            menus.push(btn);
            break;
          }
          parent = parent.parentElement;
        }
      }
    });
    
    // Filter out duplicates
    const uniqueMenus = [...new Set(menus)];
    
    console.log(` Final result: Found ${uniqueMenus.length} valid three-dot menu buttons`);
    return uniqueMenus;
  }

  // NEW: Function to specifically target published songs (skip preview songs)
  function getPublishedSongMenus() {
    console.log(' Looking specifically for PUBLISHED song menus (skipping preview songs)...');
    
    const menus = [];
    
    // Find all elements that contain "Publish" text
    const publishElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.trim().toLowerCase() === 'publish'
    );
    
    console.log(`Found ${publishElements.length} "Publish" elements`);
    
    publishElements.forEach((publishEl, index) => {
      console.log(`Checking publish element ${index + 1}...`);
      
      // Find the parent container that holds the entire song card
      let songContainer = publishEl.closest('div');
      let attempts = 0;
      
      while (songContainer && attempts < 10) {
        const containerText = songContainer.textContent || '';
        
        // Look for the complete song card (has title, duration, and publish)
        if (containerText.includes('My New Song') && 
            containerText.includes('Publish') &&
            containerText.match(/\d+:\d+/) &&
            !containerText.includes('Preview')) { // Skip preview songs
          
          console.log(` Found published song container ${index + 1}`);
          
          // Now find the three-dot menu button within this container
          const buttonsInContainer = songContainer.querySelectorAll('button');
          
          buttonsInContainer.forEach(btn => {
            const btnText = btn.textContent || '';
            const btnAriaLabel = btn.getAttribute('aria-label') || '';
            
            // Look for three-dot menu button
            if (btnText.includes('⋮') || btnText.includes('⋯') || 
                btnAriaLabel.toLowerCase().includes('more actions')) {
              console.log(` Found three-dot menu in published song ${index + 1}:`, btn);
              menus.push(btn);
            }
          });
          break;
        }
        
        songContainer = songContainer.parentElement;
        attempts++;
      }
    });
    
    console.log(` Found ${menus.length} menus for published songs`);
    return menus;
  }
  async function clickDownloadOption() {
    await sleep(1000); // Wait longer for dropdown to appear
    
    console.log('Looking for Download option in dropdown...');
    
    // Look for download in various container types that might hold menu items
    const containers = [
      ...document.querySelectorAll('[role="menu"]'),
      ...document.querySelectorAll('[role="listbox"]'),
      ...document.querySelectorAll('div[class*="dropdown"]'),
      ...document.querySelectorAll('div[class*="menu"]'),
      ...document.querySelectorAll('ul'),
      ...document.querySelectorAll('div')
    ];
    
    // Search in containers first
    for (const container of containers) {
      if (container.style.display === 'none' || !container.offsetParent) continue;
      
      const items = container.querySelectorAll('button, [role="menuitem"], a, div, span, li');
      for (const item of items) {
        const text = item.textContent || '';
        const trimmedText = text.trim().toLowerCase();
        
        if (trimmedText === 'download' && item.offsetParent) {
          console.log('Found Download option in container');
          item.click();
          return true;
        }
      }
    }
    
    // Fallback: search all visible elements
    const allElements = document.querySelectorAll('button, [role="menuitem"], a, div, span, li');
    for (const el of allElements) {
      // Skip if element is not visible
      if (!el.offsetParent) continue;
      
      const text = el.textContent || '';
      const trimmedText = text.trim().toLowerCase();
      
      if (trimmedText === 'download' || 
          (trimmedText.includes('download') && trimmedText.length < 20)) {
        console.log('Found Download option:', trimmedText);
        el.click();
        return true;
      }
    }
    
    console.log('Download option not found');
    return false;
  }

  // NEW: Enhanced function to find and click MP3 Audio option
  async function clickMP3Option() {
    await sleep(1000); // Wait longer for format options to appear
    
    console.log('Looking for MP3 Audio option...');
    
    // Look in format selection containers
    const containers = [
      ...document.querySelectorAll('[role="menu"]'),
      ...document.querySelectorAll('[role="listbox"]'),
      ...document.querySelectorAll('div[class*="dropdown"]'),
      ...document.querySelectorAll('div[class*="menu"]'),
      ...document.querySelectorAll('div[class*="format"]'),
      ...document.querySelectorAll('div')
    ];
    
    // Search in containers first
    for (const container of containers) {
      if (container.style.display === 'none' || !container.offsetParent) continue;
      
      const items = container.querySelectorAll('button, [role="menuitem"], a, div, span, li');
      for (const item of items) {
        const text = item.textContent || '';
        const trimmedText = text.trim().toLowerCase();
        
        if ((trimmedText.includes('mp3 audio') || trimmedText === 'mp3 audio' || 
             trimmedText === 'mp3') && item.offsetParent) {
          console.log('Found MP3 Audio option in container:', trimmedText);
          item.click();
          return true;
        }
      }
    }
    
    // Fallback: search all visible elements
    const allElements = document.querySelectorAll('button, [role="menuitem"], a, div, span, li');
    for (const el of allElements) {
      if (!el.offsetParent) continue;
      
      const text = el.textContent || '';
      const trimmedText = text.trim().toLowerCase();
      
      if (trimmedText.includes('mp3 audio') || 
          trimmedText === 'mp3 audio' ||
          (trimmedText === 'mp3' && el.closest('[role="menu"]'))) {
        console.log('Found MP3 Audio option:', trimmedText);
        el.click();
        return true;
      }
    }
    
    console.log('MP3 Audio option not found');
    return false;
  }

  // NEW: Enhanced function to handle the commercial rights popup
  async function handleCommercialRightsPopup() {
    await sleep(1500); // Wait longer for popup to appear
    
    console.log('Looking for commercial rights popup...');
    
    // Look for the popup dialog first
    const dialogs = document.querySelectorAll('[role="dialog"], .modal, div[class*="popup"], div[class*="modal"]');
    
    for (const dialog of dialogs) {
      if (!dialog.offsetParent) continue;
      
      const dialogText = dialog.textContent || '';
      if (dialogText.toLowerCase().includes('commercial rights') || 
          dialogText.toLowerCase().includes('download anyway')) {
        
        console.log('Found commercial rights popup');
        
        // Look for "Download Anyway" button within this dialog
        const buttons = dialog.querySelectorAll('button, [role="button"], a');
        for (const btn of buttons) {
          const text = btn.textContent || '';
          const trimmedText = text.trim().toLowerCase();
          
          if (trimmedText.includes('download anyway') || 
              trimmedText === 'download anyway') {
            console.log('Found Download Anyway button');
            btn.click();
            return true;
          }
        }
      }
    }
    
    // Fallback: search all elements for "Download Anyway"
    const allElements = document.querySelectorAll('button, [role="button"], a');
    for (const el of allElements) {
      if (!el.offsetParent) continue;
      
      const text = el.textContent || '';
      const trimmedText = text.trim().toLowerCase();
      
      if (trimmedText.includes('download anyway') || 
          trimmedText === 'download anyway') {
        console.log('Found Download Anyway button (fallback)');
        el.click();
        return true;
      }
    }
    
    console.log('No commercial rights popup found - download may proceed directly');
    return false;
  }

  // NEW: Function to attempt automatic MP3 download with workspace-specific targeting
  async function attemptMP3Download() {
    try {
      console.log('=== STARTING MP3 DOWNLOAD FOR PUBLISHED SONGS ===');
      
      // First, try to find published song menus specifically
      let threeDotMenus = getPublishedSongMenus();
      
      if (threeDotMenus.length === 0) {
        console.log('No published song menus found, trying general detection...');
        threeDotMenus = getThreeDotMenus();
      }
      
      console.log(` Total found: ${threeDotMenus.length} potential menu buttons for published songs`);
      
      if (threeDotMenus.length === 0) {
        console.log(' No three-dot menus found.');
        console.log(' Make sure you are in "My Workspace" with published songs (not preview songs)');
        console.log(' Published songs should show "Publish" status, not "v4.5+ Preview"');
        return false;
      }
      
      for (let i = 0; i < threeDotMenus.length; i++) {
        const menu = threeDotMenus[i];
        try {
          console.log(`=== TRYING PUBLISHED SONG MENU ${i + 1}/${threeDotMenus.length} ===`);
          console.log('Menu element:', menu);
          console.log('Menu text:', menu.textContent);
          console.log('Menu aria-label:', menu.getAttribute('aria-label'));
          
          // Get context about this song
          const songContainer = menu.closest('div');
          if (songContainer) {
            const containerText = songContainer.textContent || '';
            console.log('Song context:', containerText.substring(0, 150) + '...');
            
            // Skip if this is a preview song
            if (containerText.includes('Preview')) {
              console.log('⏭ Skipping preview song - needs upgrade');
              continue;
            }
          }
          
          // Scroll menu into view and click
          menu.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await sleep(800);
          
          console.log('🖱 Clicking three-dot menu...');
          menu.click();
          
          // Wait longer for dropdown to appear
          await sleep(1500);
          
          console.log(' Looking for Download option...');
          const downloadClicked = await clickDownloadOption();
          
          if (downloadClicked) {
            console.log(' Download option found and clicked');
            
            // Wait for format selection
            await sleep(1200);
            console.log(' Looking for MP3 Audio option...');
            const mp3Clicked = await clickMP3Option();
            
            if (mp3Clicked) {
              console.log(' MP3 Audio option clicked');
              
              // Wait for potential popup
              await sleep(1500);
              console.log(' Checking for commercial rights popup...');
              const popupHandled = await handleCommercialRightsPopup();
              
              if (popupHandled) {
                console.log(' Commercial rights popup handled - clicked "Download Anyway"');
              } else {
                console.log('ℹ No popup appeared - download may have started directly');
              }
              
              console.log(' MP3 download should have started! Check your downloads folder.');
              await sleep(3000);
              return true;
            } else {
              console.log(' MP3 Audio option not found - may need to scroll in format menu');
            }
          } else {
            console.log(' Download option not found in dropdown');
          }
          
          // Close menu and try next
          console.log('⏭ This menu did not work, trying next song...');
          document.body.click();
          await sleep(1000);
          
        } catch (error) {
          console.log(' Error with this menu:', error);
          document.body.click();
          await sleep(1000);
          continue;
        }
      }
      
      console.log(' No working download menus found for published songs');
      console.log(' Try manually: Click three-dot menu → Download → MP3 Audio → Download Anyway');
      return false;
    } catch (error) {
      console.error(' MP3 download attempt failed:', error);
      return false;
    }
  }

  // NEW: Manual trigger function for testing
  window.triggerMP3Download = async function() {
    console.log('🔧 MANUAL MP3 DOWNLOAD TRIGGER');
    const result = await attemptMP3Download();
    if (result) {
      console.log('✅ Manual download attempt completed');
    } else {
      console.log('❌ Manual download attempt failed');
    }
    return result;
  };

  // NEW: Function to check if we're in the workspace with generated songs
  function checkInWorkspaceWithSongs() {
    // Check if we're in workspace by looking for text content
    const headings = document.querySelectorAll('h1, h2, h3, div, span');
    const workspaceHeading = Array.from(headings).find(h => 
      h.textContent && h.textContent.trim().toLowerCase().includes('workspace')
    );
    
    // Also check for workspace-related attributes
    const workspaceIndicators = [
      document.querySelector('[data-testid*="workspace"]'),
      document.querySelector('*[class*="workspace"]'),
      document.querySelector('*[id*="workspace"]')
    ];
    
    // Look for song cards with three-dot menus
    const songCards = document.querySelectorAll('[class*="song"], [data-testid*="song"]');
    const threeDotMenus = getThreeDotMenus();
    
    // Check if songs have "Publish" status (indicating they're ready)
    const publishElements = Array.from(document.querySelectorAll('button, div, span')).filter(el => 
      el.textContent && el.textContent.trim().toLowerCase() === 'publish'
    );
    
    const inWorkspace = workspaceIndicators.some(el => el !== null) || workspaceHeading !== null;
    const hasSongs = songCards.length > 0 || threeDotMenus.length > 0;
    const hasPublishedSongs = publishElements.length > 0;
    
    console.log(`Workspace check - In workspace: ${inWorkspace}, Has songs: ${hasSongs}, Published songs: ${hasPublishedSongs}`);
    
    return inWorkspace && hasSongs && hasPublishedSongs;
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
      let mp3Downloaded = false; // NEW: Track MP3 download status
      let retries = 0;

      const monitor = setInterval(async () => {
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

        // NEW: Check if we're in workspace with published songs and attempt MP3 download
        if (cfg.downloadMP3 && !mp3Downloaded && checkInWorkspaceWithSongs()) {
          console.log('In workspace with published songs, attempting MP3 download...');
          const success = await attemptMP3Download();
          if (success) {
            mp3Downloaded = true;
            console.log('MP3 download completed!');
          } else {
            console.log('MP3 download attempt unsuccessful, will retry...');
          }
        }

        // Complete when all tasks are done
        if (foundLyrics && publishBtnFound && (!cfg.downloadMP3 || mp3Downloaded)) {
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
