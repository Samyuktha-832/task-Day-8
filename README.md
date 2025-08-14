Suno.AI Automation Script
Overview
This script automates the generation of song lyrics on Suno.AI using JavaScript. It sets the song title, adds styles, inserts lyrics text, clicks the "Create" button, and monitors for the generated lyrics and the "Publish" button. Optionally, it can download the lyrics as a .txt file.

Key Features
Automatically sets song title and lyrics.

Adds multiple styles/tags as chips.

Uses MutationObserver to monitor changes in the DOM.

Detects when lyrics are generated and downloads them.

Handles popups and settings modals.

How It Works
1. Setting Inputs
setReactValue(element, value) sets the value of input fields, textareas, or other DOM elements, ensuring React updates detect the change.

2. Clicking Buttons
clickByTextContains(text) clicks buttons or links that contain a specified text.

3. Adding Styles
addStylesAsChips(inputEl, styles) inserts style tags and simulates pressing "Enter" after each tag with a short delay.

4. Monitoring Lyrics
getLyricsEl() locates the DOM element containing generated lyrics.

getPublishBtn() detects the publish button.

A combination of setInterval and retry logic monitors the DOM for generated content.

Uses MutationObserver conceptually to watch for DOM changes (here manually simulated with polling).

5. Downloading Lyrics
downloadLyrics(lyrics, filename) creates a text file from the lyrics and triggers a download.

6. Handling Modals
closeSettingsModalIfOpen() closes any popups that might block interactions.

7. Execution
The main() function orchestrates all steps:

Close popups.

Set title, styles, and lyrics.

Click "Create".

Monitor for generated lyrics and publish button.

Download lyrics if configured.

Download the song as Mp3 file
