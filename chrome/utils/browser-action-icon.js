// Update the state of the browser action icon
var BrowserActionIcon = {
  // Set the browser action for specified project
  // Update the text, title and color
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
      title = "You are not in a project";
      text = "None";
      color = "#000";
    } else {
      title = "You are in the " + project.name + " project";
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

  // Disable the browser action so that it is not clickable.
  // Set the text to "...", title and color to indicate loading state
  disable: function() {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "disableBrowserActionIcon"
      });
      return;
    }

    chrome.browserAction.setBadgeText({
      text: "..."
    });
    chrome.browserAction.setTitle({
      title: "Loading..."
    });
    chrome.browserAction.setBadgeBackgroundColor({
      color: "#04859D"
    });

    chrome.browserAction.disable();
  },

  // Enable the browser action to make it clickable
  enable: function() {
    if (!chrome.browserAction) {
      chrome.extension.sendMessage({
        action: "enableBrowserActionIcon"
      });
      return;
    }

    chrome.browserAction.enable();
  }
}
