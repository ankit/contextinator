// Manages the projects local storage and opening and closing projects.
// Also, opens/closes different views like homepage, overview and new project
// page.

var Projects = {
  // Add a new project and mark it as currently active
  add: function(name, callback) {
    chrome.storage.local.get(null, function(items) {
      var projects = items["projects"];
      var project = {
        name: name,
        apps: {}
      };

      chrome.windows.getLastFocused({populate: true}, function(aWindow) {
        project.windowId = aWindow.id;
        project.lastAccessed = new Date().getTime();
        project.tabs = aWindow.tabs;
        projects.push(project);

        var active = projects.length - 1;
        // remove the window from the temporary window cache
        var temporaryWindows = items["temporaryWindows"];
        var newSet = [];
        for (var i = 0; i < temporaryWindows.length; i++) {
          if (temporaryWindows[i].id != aWindow.id) {
            newSet.push(temporaryWindows[i]);
          }
        }

        chrome.storage.local.set({
          projects: projects,
          active: active,
          temporaryWindows: newSet
        }, callback);

        BrowserActionIcon.set(project);
        callback();
      });
    });
  },

  // Remove a project and close the project window (if it is open)
  remove: function(project, callback) {
    chrome.storage.local.get(null, function(items) {
      var projects = items["projects"];
      var len = projects.length;
      var active = items["active"];

      for (var i = 0; i < len; i++) {
        if (projects[i].name === project.name) {
          // update the project so that it has the windowId
          project = projects[i];
          break;
        }
      }

      projects.splice(i, 1);
      chrome.storage.local.set({projects: projects});
      if (active == i) {
        chrome.storage.local.remove("active");
      }

      // close the window for this project.
      if (project.windowId) {
        chrome.windows.remove(project.windowId, function(){});
      }

      callback();
    });
  },

  // Return all the existing projects
  getAll: function(callback) {
    chrome.storage.local.get("projects", function(items) {
      callback(items["projects"]);
    });
  },

  // Get project by name. If not found, returns null.
  getByName: function(name, callback) {
    chrome.storage.local.get("projects", function(items) {
      var projects = items["projects"];
      var len = projects.length;

      for (var i = 0; i < len; i++) {
        if (name == projects[i].name) {
          callback(projects[i]);
          return;
        }
      }

      callback(null);
    });
  },

  // Get a temporary window by its id
  getTemporaryWindow: function(id, callback) {
    chrome.storage.local.get("temporaryWindows", function(items) {
      var temporaryWindows = items["temporaryWindows"];
      var len = temporaryWindows.length;

      for (var i = 0; i < len; i++) {
        if (id == temporaryWindows[i].id) {
          callback(temporaryWindows[i]);
          return;
        }
      }

      callback(null);
    });
  },

  // Save a project
  save: function(project, callback) {
    chrome.storage.local.get("projects", function(items) {
      var projects = items["projects"];
      var len = projects.length;

      for (var i = 0; i < len; i++) {
        if (projects[i].name == project.name) {
          projects[i] = project;
          chrome.storage.local.set({"projects": projects}, callback);
          break;
        }
      }
    });
  },

  // Save an app for a project
  saveApp: function(projectName, appKey, appUrl, callback) {
    chrome.storage.local.get("projects", function(items) {
      var projects = items["projects"];
      var length = projects.length;

      for (var i = 0; i < length; i++) {
        if (projects[i].name == projectName) {
          if (!projects[i].apps) {
            projects[i].apps = {};
          }

          projects[i].apps[appKey] = appUrl;
          chrome.storage.local.set({"projects": projects}, callback);
          break;
        }
      }
    });
  },

  // Mark the specified project/window as active
  setActive: function(project, windowId, callback) {
    if (project == null) {
      chrome.storage.local.remove("active");
      BrowserActionIcon.set(null);
      callback();
      return true;
    }

    chrome.storage.local.get("projects", function(items) {
      var projects = items["projects"];
      var len = projects.length;

      for (var i = 0; i < len; i++) {
        if (project.name == projects[i].name) {
          projects[i].lastAccessed = new Date().getTime();

          if (windowId) {
            projects[i].windowId = windowId;
          }

          chrome.storage.local.set({'active': i}, function() {
            chrome.storage.local.set({'projects': projects}, function() {
              callback();
            });
          });

          break;
        }
      }
    });
  },

  // Open or focus a project window or non-project window
  open: function(project, showHomepage, url, callback) {
    if (!callback) {
      callback = function() {};
    }

    // if it is an existing window.
    if (project.height != undefined) {
      console.log("Switched to non-project window");
      WindowUtils.focus(project.id, callback);
      return true;
    }

    if (project.windowId) {
      console.log("Switched to project: " + project.name);
      chrome.storage.local.set({"openingWindowType": 1});

      if (showHomepage) {
        Projects.openHomepage(project, function() {
          WindowUtils.focus(project.windowId, callback);
        });
      } else {
        if (url) {
          chrome.tabs.create({
            url: url,
            active: true,
            windowId: project.windowId
          }, function() {
            WindowUtils.focus(project.windowId, callback);
          });
        } else {
          WindowUtils.focus(project.windowId, callback);
        }
      }

      return true;
    }

    else {
      console.log("Creating new window for project: " + project.name);
      chrome.storage.local.set({"openingWindowType": 3});

      var tabs = [];
      var foundHomepage = false;
      var homepageURL = "chrome-extension://" +
        chrome.i18n.getMessage("@@extension_id") +
        "/home/home.html";

      var urls = [];

      var tabs = project.tabs;
      var len = tabs.length;
      for (var i = 0; i < len; i++) {
        var tab = tabs[i];
        urls.push(tab.url);
      }

      Projects.setActive(project, null, function() {
        WindowUtils.create(urls, function(newWindow) {
          callback();
        });
      });
    }
  },

  // Close a project's window
  close: function(project) {
    if (!project.windowId && !project.id) {
      return;
    }

    var windowId = project.windowId ? project.windowId : project.id;
    WindowUtils.close(windowId);
  },

  // Focus (or open) the homepage for the currently active project
  openHomepage: function(project, callback) {
    if (!callback) {
      callback = function(){};
    }

    if (project && project.windowId) {
      chrome.windows.get(project.windowId, {populate: true}, function(aWindow) {
        var tabs = aWindow.tabs;
        var length = tabs.length;

        for (var i = 0; i < length; i++) {
          var tab = tabs[i];
          if (tab.url.indexOf("home.html") != -1) {
            chrome.tabs.update(tab.id, {active: true}, callback);
            return;
          }
        }

        // it wasn't found, open the homepage for the current project
        chrome.tabs.create({
          index: 0,
          active: true,
          windowId: project.windowId,
          url: "home/home.html"
        }, callback);
      });
    }
  },

  // Associate the currently active window with the specified project
  setCurrentWindow: function(project, callback) {
    chrome.windows.getCurrent(function(aWindow) {
      project.windowId = aWindow.id;
      Projects.save(project, function() {
        callback({project: project});
      });
    });
  },

  // Open a new window to start a new project
  openNewProject: function() {
    WindowUtils.create("../new/new.html");
  },

  // Open a tab to start a new project in the currently active window
  openNewProjectForCurrentWindow: function() {
    WindowUtils.openTabInCurrentWindow("../new/new.html", 0);
  },

  // Open / focus the Projects Overview window
  openOverview: function(callback) {
    if (!callback) {
      callback = function(){};
    }

    chrome.storage.local.get("overviewWindowId", function(items) {
      var windowId = items["overviewWindowId"];

      // see background.js
      chrome.storage.local.set({"openingWindowType": 2}, function() {
        if (windowId) {
          WindowUtils.focus(windowId, callback);
        } else {
          WindowUtils.create("overview/overview.html", callback);
        }
      });
    });
  },

  // Closes the overview window, if it exists
  closeOverview: function() {
    chrome.storage.local.get("overviewWindowId", function(items) {
      if (items['overviewWindowId']) {
        if (chrome.windows) {
          chrome.windows.remove(items['overviewWindowId']);
        } else {
          chrome.extension.sendMessage({
            action: "closeWindow",
            id: items['overviewWindowId']
          });
        }
      }
    });
  }
}
