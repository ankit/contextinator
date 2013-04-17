// Helpers to manage windows in chrome, including creating, focussing and
// closing a window

function createWindow(url, callback) {
  if (!callback) {
    callback = function(){};
  }

  if (!chrome.windows) {
    chrome.extension.sendMessage({
      action: "createWindow",
      url: url
    }, callback);
    return;
  }

  chrome.windows.getLastFocused(null, function(current) {
    var options = {
      focused: true
    };

    if (current) {
      options.height = current.height;
      options.width = current.width;
      options.left = current.left;
      options.top = current.top;
    }

    if (url) {
      options.url = url;
    }

    chrome.windows.create(options, function(newWindow) {
      callback(newWindow);
    });
  });
}

function focusWindow(id, callback) {
  if (!callback) {
    callback = function() {};
  }

  if (!chrome.windows) {
    chrome.extension.sendMessage({
      action: "focusWindow",
      id: id
    }, callback);
    return;
  }

  chrome.windows.update(id, {focused: true}, callback);
}

function closeWindow(id, callback) {
  if (!callback) {
    callback = function() {};
  }

  if (!chrome.windows) {
    chrome.extension.sendMessage({
      action: "closeWindow",
      id: id
    }, callback);
    return;
  }

  chrome.windows.remove(id, callback);
}

function openTabInCurrentWindow(url, index) {
  if (chrome.windows) {
    chrome.windows.getLastFocused({}, function(aWindow) {
      chrome.tabs.create({
        windowId: aWindow.id,
        url: url,
        index: index
      });
    });
  } else {
    chrome.extension.sendMessage({
      action: "openTabInCurrentWindow",
      url: "../new/new.html",
      index: index
    });
  }
}
