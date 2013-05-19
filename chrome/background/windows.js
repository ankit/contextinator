// This listens to tab and window events, including things like open, close,
// refresh. Updates projects accordingly. Also has helper methods to create,
// remove and active tabs and windows.

// todo: eliminate these globals
var windowTypeBlacklist = ["popup", "panel"];

// On window focus change, update the active project.
chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (windowId === -1) {
    return;
  }

  BrowserActionIcon.disable();
  updateContextMenu();

  chrome.storage.local.get(null, function(items) {
    var active = items["active"];
    var projects = items["projects"];
    var temporaryWindows = items["temporaryWindows"];
    var overviewWindowId = items["overviewWindowId"];
    var openingWindowType = items["openingWindowType"];
    var lastFocusedWindowId = items["lastFocusedWindowId"];

    var len = projects.length;
    console.log("Opening Window Type: " + openingWindowType);

    // user opened or switched to the Overview window
    if (openingWindowType == 2 || (windowId == overviewWindowId)) {
      BrowserActionIcon.set(null);
      BrowserActionIcon.enable();

      chrome.storage.local.set({
        "overviewWindowId": windowId,
        "openingWindowType": 0
      });

      chrome.storage.local.remove("active");
      reloadJumperForWindow(windowId);
      chrome.storage.local.set({"lastFocusedWindowId": windowId});
      return;
    }

    // user opened a new project window, set the window id for the active
    // project
    else if (openingWindowType == 3) {
      projects[active].windowId = windowId;

      chrome.storage.local.set({
        "projects": projects,
        "openingWindowType": 0
      });

      var project = projects[active];

      // Update browser action
      BrowserActionIcon.enable();
      BrowserActionIcon.set(project);

      // Bring back the pinned state of tabs
      chrome.windows.getCurrent({populate: true}, function(currentWindow) {
        var len = project.tabs.length;
        for (var i = 0; i < len; i++) {
          var tab = project.tabs[i];
          if (tab.pinned) {
            console.log("PINNING TAB");
            chrome.tabs.update(currentWindow.tabs[i].id, {pinned: true});
          }
        }
      });

      chrome.storage.local.set({"lastFocusedWindowId": windowId});
      return;
    }

    // else, check if user switched to an already open project window
    chrome.storage.local.set({"openingWindowType": 0});

    for (var i = 0; i < len; i ++) {
      if (projects[i].windowId == windowId) {
        // update the last accessed time
        projects[i].lastAccessed = new Date().getTime();
        BrowserActionIcon.set(projects[i]);
        BrowserActionIcon.enable();
        console.log("Setting project as active: " + projects[i].name);
        chrome.storage.local.set({"active": i, projects: projects}, function() {
          reloadJumperForWindow(windowId);
        });

        if (lastFocusedWindowId != windowId) {
          chrome.storage.local.set({"lastFocusedWindowId": windowId});
        }

        return;
      }
    }

    // else, user switched or opened a new non-project window
    chrome.storage.local.remove("active");

    chrome.windows.get(windowId, {populate: true}, function(aWindow) {
      if (windowTypeBlacklist.indexOf(aWindow.type) == -1) {
        var lastAccessed = new Date().getTime();

        if (temporaryWindows) {
          var len = temporaryWindows.length;
          var windowFound = false;

          for (var i = 0; i < len; i++) {
            if (temporaryWindows[i].id === aWindow.id) {
              temporaryWindows[i].lastAccessed = lastAccessed;
              windowFound = true;
              break;
            }
          }

          if (!windowFound) {
            aWindow.lastAccessed = lastAccessed;
            temporaryWindows.push(aWindow);
          }

        } else {
          aWindow.lastAccessed = lastAccessed;
          temporaryWindows = [aWindow];
        }

        chrome.storage.local.set({"temporaryWindows": temporaryWindows}, function() {
          reloadJumperForWindow(windowId);
        });

        if (lastFocusedWindowId != windowId) {
          chrome.storage.local.set({"lastFocusedWindowId": windowId});
        }
      }

      BrowserActionIcon.set(null);
      BrowserActionIcon.enable();
    });
  });
});

// When a window is removed, remove it from active projects
// or temporary windows
chrome.windows.onRemoved.addListener(function(windowId) {
  closeProjectWindow(windowId);
});

// Saves tabs when a tab is updated
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId != 0) return;

  chrome.tabs.get(details.tabId, function(tab) {
    saveTabs(tab.windowId, tab, function() {
      sendReloadJumperRequest(tab.id);
    });
  });
});

// Save tabs when a tab is activated
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    saveTabs(activeInfo.windowId, tab, function() {
      sendReloadJumperRequest(activeInfo.tabId);
    });
  });
});

// Save tabs when a tab is pinned/unpinned
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.pinned != undefined) {
    saveTabs(tab.windowId, tab, function() {
      sendReloadJumperRequest(tabId);
    });
  }
});

// Save tabs when a tab is removed
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  if (!removeInfo.isWindowClosing) {
    chrome.windows.getCurrent({populate: true}, function(aWindow) {
      saveTabs(aWindow.id);
    });
  }
});

// Send the request to reload jumper for the active tab in a window
function reloadJumperForWindow(windowId) {
  chrome.windows.get(windowId, {populate: true}, function(aWindow) {
    var tabs = aWindow.tabs;
    var len = tabs.length;
    for (var i = 0; i < len; i++) {
      if (tabs[i].active && tabs[i].url.indexOf("chrome://") == -1) {
        sendReloadJumperRequest(tabs[i].id);
        break;
      }
    }
  });
}

// Sends a request to the tab with the specified id to reload the jumper
function sendReloadJumperRequest(id) {
  chrome.tabs.sendMessage(id, "reloadJumper", function() {});
}

// Removes the tab with the specified url in the current window
function deleteTabInCurrentWindow(url, callback) {
  chrome.windows.getCurrent({populate: true}, function(aWindow) {
    var length = aWindow.tabs.length;
    for (var i = 0; i < length; i++) {
      var tab = aWindow.tabs[i];
      if (tab.url == url) {
        chrome.tabs.remove(tab.id, callback);
        callback();
      }
    }
  });

  callback();
}

// Activate the tab with the specified url in the current window
function activateTabInCurrentWindow(url, callback) {
  chrome.windows.getCurrent({populate: true}, function(aWindow) {
    var length = aWindow.tabs.length;
    for (var i = 0; i < length; i++) {
      var tab = aWindow.tabs[i];
      if (tab.url == url) {
        chrome.tabs.update(tab.id, {active: true}, callback);
        return;
      }
    }

    callback();
  });
}

// Refresh the temporary window cache
function refreshTemporaryWindows(callback) {
  chrome.windows.getAll({populate: true}, function(windows) {
    windows = _.filter(windows, function(aWindow) {
      if (windowTypeBlacklist.indexOf(aWindow.type) == -1) {
        return true;
      }
    });

    // add last accessed time
    var lastAccessed = new Date().getTime();
    windows = _.map(windows, function(aWindow) {
      aWindow.lastAccessed = lastAccessed;
      return aWindow;
    });

    chrome.storage.local.set({"temporaryWindows": windows}, callback);
  });
}

// Save tabs for a project or non-project window
function saveTabs(windowId, tab, callback) {
  if (!callback) {
    callback = function(){};
  }

  chrome.storage.local.get(null, function(items) {
    var projects = items["projects"];
    var active = projects[items["active"]];
    var overviewWindowId = items["overviewWindowId"];
    var len = projects.length;
    var projectIndex = -1;

    if (windowId == overviewWindowId) {
      return;
    }

    for (var i = 0; i < len; i++) {
      if (projects[i] && projects[i].windowId === windowId) {
        projectIndex = i;
        break;
      }
    }

    // if project does not exist, check temporary windows.
    var temporaryWindows = items["temporaryWindows"];
    var windowIndex = -1
    if (projectIndex === -1) {
      len = temporaryWindows.length;
      for (var i = 0; i < len; i++) {
        if (temporaryWindows[i].id === windowId) {
          windowIndex = i;
          break;
        }
      }
    }

    if (projectIndex != -1 || windowIndex != -1) {
      // update the tabs
      chrome.tabs.getAllInWindow(windowId, function(tabs) {
        if (!tabs) {
          return;
        }

        var savedTabs = [];
        _.each(tabs, function(tab) {
          savedTabs.push({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            pinned: tab.pinned
          });
        });

        if (projectIndex != -1) {
          console.log("Saving tabs for project: " + projects[projectIndex].name);
          projects[projectIndex].tabs = savedTabs;
        } else {
          console.log("Saving tabs for non-project window");
          temporaryWindows[windowIndex].tabs = savedTabs;
        }

        // update the thumbnail
        if (tab && tab.url.indexOf("chrome://") == -1) {
          chrome.tabs.captureVisibleTab(windowId, {format: "jpeg", quality: 1}, function(data) {
            if (projectIndex != -1) {
              projects[projectIndex].thumbnail = data;
              chrome.storage.local.set({
                "projects": projects,
                "active": projectIndex
              }, function() {
                callback();
              });
            } else {
              temporaryWindows[windowIndex].thumbnail = data;
              chrome.storage.local.set({"temporaryWindows": temporaryWindows}, function() {
                callback();
              });
            }
          });
        }
      });
    }
  });
}

// Closes a project or non-project window and update the local store
function closeProjectWindow(windowId) {
  chrome.storage.local.get(null, function(items) {
    var updatedProject = false;
    var projects = items["projects"];
    var len = projects.length;
    var overviewWindowId = items["overviewWindowId"];

    if (overviewWindowId && overviewWindowId == windowId) {
      chrome.storage.local.remove("overviewWindowId");
      return true;
    }

    for (var i = 0; i < len; i++) {
      if (projects[i].windowId == windowId) {
        break;
      }
    }

    if (i < len) {
      projects[i].windowId = null;
      console.log("Removed window for project: " + projects[i].name);
      chrome.storage.local.set({"projects": projects});
    } else {
      var temporaryWindows = items["temporaryWindows"];
      console.log("Removed non-project window");
      temporaryWindows = _.filter(temporaryWindows, function(aWindow) {
        return aWindow.id !== windowId;
      });

      chrome.storage.local.set({"temporaryWindows": temporaryWindows});
    }
  });
}
