// ==UserScript==
// @name         Network Requests Logger for playlist.m3u8
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Logs network requests containing "playlist.m3u8" and provides a button to download them in Notepad.
// @author       Kissbox - Disord
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const networkRequests = [];

    function logNetworkRequest(event) {
        const { method, url } = event;
        networkRequests.push({ method, url });
        createDownloadButton(); // Display the button whenever a new request is logged
    }

    function checkForMatchingRequests() {
        const matchingRequests = networkRequests.filter(req => req.url.includes("playlist.m3u8"));
        if (matchingRequests.length > 0) {
            createDownloadButton();
        }
    }

    const originalFetch = window.fetch;
    window.fetch = function() {
        const fetchArguments = arguments;
        return originalFetch.apply(this, fetchArguments).then(response => {
            const request = fetchArguments[0];
            if (request.url.includes("playlist.m3u8")) {
                logNetworkRequest({
                    method: request.method,
                    url: request.url,
                });
            }
            return response;
        });
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("loadend", function() {
            if (this._url.includes("playlist.m3u8")) {
                logNetworkRequest({
                    method: this._method,
                    url: this._url,
                });
            }
        });
        this._method = arguments[0];
        this._url = arguments[1];
        originalOpen.apply(this, arguments);
    };

    function openInNotepad(content) {
        const a = document.createElement('a');
        a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        a.target = '_blank';
        a.download = 'playlist_requests.txt';
        a.click();
    }

    function createDownloadButton() {
        // Check if the button already exists
        const existingButton = document.getElementById('downloadButton');
        if (!existingButton) {
            const button = document.createElement('button');
            button.id = 'downloadButton';
            button.textContent = 'Download Playlist Requests';
            button.style.position = 'fixed';
            button.style.top = '10px';
            button.style.right = '10px';
            button.addEventListener('click', () => {
                const matchingRequests = networkRequests.filter(req => req.url.includes("playlist.m3u8"));
                if (matchingRequests.length > 0) {
                    const textContent = matchingRequests.map(req => `Request method: ${req.method}, URL: ${req.url}`).join('\n');
                    openInNotepad(textContent);
                }
            });

            document.body.appendChild(button);
        }
    }

    // Check for matching requests every 5 seconds
    setInterval(checkForMatchingRequests, 5000);
})();
