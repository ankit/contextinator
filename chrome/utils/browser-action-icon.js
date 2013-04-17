// Enables/disables and sets the text for the browser action icon

var BrowserActionIcon = {
  set: function (project) {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "setBrowserActionIcon",
        project: project
      });
      return;
    }

    var title, text, color;

    if (!project) {
      title = "You're not in a project";
      text = "None";
      color = "#000";
    } else {
      title = "You're in the " + project.name + " project";
      text = project.name;
      color = "#91BD83";
    }

    chrome.browserAction.setBadgeText({
      text: text
    });

    chrome.browserAction.setBadgeBackgroundColor({
      color: color
    });

    chrome.browserAction.setTitle({
      title: title
    });
  },

  disable: function() {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "disableBrowserActionIcon"
      });
      return;
    }

    chrome.browserAction.disable();
  },

  enable: function() {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "enableBrowserActionIcon"
      });
      return;
    }

    chrome.browserAction.enable();
  },

  disableBadgeText: function() {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "disableBrowserActionIconText"
      });
      return;
    }

    chrome.browserAction.setBadgeText({
      text: ""
    });
  }
}
