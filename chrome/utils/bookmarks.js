// modify Bookmarks
var Bookmarks = {
  // Create a parent bookmark folder, if it does not exist
  init: function(callback) {
    chrome.storage.local.get("bookmarkFolderId", function(items) {
      if (!items["bookmarkFolderId"]) {
        chrome.bookmarks.create({title: "Contextinator"}, function(result) {
          chrome.storage.local.set({"bookmarkFolderId": result.id}, function() {
            callback();
          });
        });
      } else {
        callback();
      }
    });
  },

  // Handle new bookmark request from context menu
  newFromContextMenu: function(info, tab) {
    chrome.storage.local.get(["projects", "active"], function(items) {
      var projects = items["projects"];
      var active = items["active"];
      var activeProject = projects[active];
      if (activeProject) {
        Bookmarks.new(tab, activeProject);
      }
    });
  },

  // Bookmark the current tab in the specified project.
  // Called from the browser action popup
  newForCurrentTab: function(project, callback) {
    if (!callback) {
      callback = function() {};
    }

    chrome.windows.getLastFocused({populate: true}, function(aWindow) {
      var tabs = aWindow.tabs;
      var length = tabs.length;
      for (var i = 0; i < length; i++) {
        if (tabs[i].active) {
          Bookmarks.new(tabs[i], project);
          callback();
          return;
        }
      }
      callback();
    });
  },

  // Bookmark the specified tab in the specified project
  new: function(tab, project) {
    chrome.storage.local.get(null, function(items) {
      var projects = items["projects"];
      var bookmarkFolderId = items["bookmarkFolderId"];

      if (project && bookmarkFolderId) {
        if (!project.bookmarkFolderId) {
          chrome.bookmarks.create({
            parentId: bookmarkFolderId,
            title: project.name
          }, function(result) {
            project.bookmarkFolderId = result.id;
            var len = projects.length;
            for (var i = 0; i < len; i++) {
              if (projects[i].name === project.name) {
                projects[i].bookmarkFolderId = project.bookmarkFolderId;
              }
            }

            chrome.storage.local.set({"projects": projects}, function() {
              Bookmarks.create(tab, project.bookmarkFolderId);
            });
          });
        } else {
          Bookmarks.create(tab, project.bookmarkFolderId);
        }
      }
    });
  },

  // Make the request to create a bookmark
  create: function(tab, parentId) {
    chrome.bookmarks.create({
      title: tab.title,
      url: tab.url,
      parentId: parentId
    }, function(result) {
      chrome.storage.local.get('bookmarkScreenshots', function(items) {
        var bookmarkScreenshots = items['bookmarkScreenshots'];
        if (!bookmarkScreenshots) {
          bookmarkScreenshots = {};
        }

        chrome.tabs.captureVisibleTab(tab.windowId, {}, function(data) {
          bookmarkScreenshots[result.id] = data;
          chrome.storage.local.set({'bookmarkScreenshots': bookmarkScreenshots});
        });
      });
    });
  },

  // Get the bookmarks for the specified project
  getAll: function(project, callback) {
    var id = project.bookmarkFolderId;

    if (id) {
      chrome.storage.local.get('bookmarkScreenshots', function(items) {
        var bookmarkScreenshots = items['bookmarkScreenshots'];
        chrome.bookmarks.getChildren(id, function(bookmarks) {
          if (bookmarkScreenshots) {
            var length = bookmarks.length;
            for (var i = 0; i < length; i++) {
              if (bookmarkScreenshots[bookmarks[i].id]) {
                bookmarks[i].image = bookmarkScreenshots[bookmarks[i].id];
              }
            }
          }

          callback(bookmarks);
        });
      });
    } else {
      callback([]);
    }
  },

  // Open a bookmark in a new tab
  open: function(url) {
    chrome.tabs.create({
      url: url
    });
  },

  // Remove a bookmark
  remove: function(id) {
    chrome.bookmarks.remove(id + "", function(){});
    chrome.storage.local.get('bookmarkScreenshots', function(items) {
      var bookmarkScreenshots = items['bookmarkScreenshots'];
      delete bookmarkScreenshots[id];
      chrome.storage.local.set({'bookmarkScreenshots': bookmarkScreenshots});
    });
  },

  // Update the specified project by adding the bookmarks data
  updateProject: function(projects, index, callback) {
    if (projects[index] && projects[index].bookmarkFolderId) {
      chrome.bookmarks.getChildren(projects[index].bookmarkFolderId, function(bookmarks) {
        projects[index].bookmarks = bookmarks;
        callback(projects);
      });
    } else {
      projects[index].bookmarks = [];
      callback(projects);
    }
  }
}
