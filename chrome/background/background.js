function init() {
  BrowserActionIcon.disableBadgeText();
  BrowserActionIcon.disable();

  // This keep tracks of the current window type that is being opened.
  // 0 -> Non-project Window
  // 1 -> Project Window
  // 2 -> Overview Window
  // 3 -> New Project Window
  chrome.storage.local.set({"openingWindowType": 0});

  chrome.storage.local.get(["projects", "apps"], function(items) {
    var projects = items["projects"];

    if (!projects) {
      projects = [];
    } else {
      // flush the window cache
      var length = projects.length;
      for (var i = 0; i < length; i++) {
        projects[i].windowId = null;
      }
    }

    chrome.storage.local.set({"apps": APPS});

    chrome.storage.local.set({"projects": projects}, function() {
      chrome.storage.local.remove([
        "active",
        "overviewWindowId"
      ], function() {
        refreshTemporaryWindows(function() {
          Bookmarks.init(function() {
            BrowserActionIcon.enable();
            BrowserActionIcon.set(null);
          });
        });
      });
    });
  });
}

chrome.runtime.onStartup.addListener(function() {
  init();
});

chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === "install") {
    init();
  }
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "deleteTab") {
    deleteTabInCurrentWindow(request.url, sendResponse);
  } else if (request.action === "activateTab") {
    activateTabInCurrentWindow(request.url, sendResponse);
  } else if (request.action === "closeWindow") {
    chrome.windows.remove(request.id, sendResponse);
  } else if (request.action === "focusWindow") {
    chrome.windows.update(request.id, {focused: true}, sendResponse);
  } else if (request.action === "createWindow") {
    createWindow(request.url);
  } else if (request.action === "openTabInCurrentWindow") {
    openTabInCurrentWindow(request.url, request.index);
  } else if (request.action === "setBrowserActionIcon") {
    BrowserActionIcon.set(request.project);
    sendResponse({});
  } else if (request.action === "disableBrowserActionIcon") {
    BrowserActionIcon.disable();
    sendResponse({});
  } else if (request.action === "enableBrowserActionIcon") {
    BrowserActionIcon.enable();
    sendResponse({});
  } else if (request.action === "disableBrowserActionIconText") {
    BrowserActionIcon.disableBadgeText();
    sendResponse({});
  }

  return true;
});
