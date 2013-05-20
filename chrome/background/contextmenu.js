// Context menu

var ContextMenu = {
  PROJECT_ID_PREFIX: "_p_",

  update: function() {
    chrome.contextMenus.removeAll();
    chrome.storage.local.get(["projects", "active"], function(items) {
      var projects = items["projects"];
      var currentProject = projects[items["active"]];

      chrome.contextMenus.create({
        id: "root",
        title: "Contextinator",
        contexts: ["all"]
      });

      if (currentProject) {
        chrome.contextMenus.create({
          id: "bookmark",
          title: "Bookmark in " + currentProject.name,
          contexts: ["all"],
          parentId: "root"
        });
      }

      chrome.contextMenus.create({
        id: "sendtab",
        title: "Send Tab to Project",
        contexts: ["all"],
        parentId: "root"
      });

      _.each(projects, function(project, index) {
        if (project != currentProject) {
          chrome.contextMenus.create({
            id: ContextMenu.PROJECT_ID_PREFIX + project.name,
            title: project.name,
            contexts: ["all"],
            parentId: "sendtab"
          });
        }
      });
    });
  },

  onClick: function(info, tab) {
    if (info.menuItemId === "bookmark") {
      Bookmarks.newFromContextMenu(info, tab);
    } else if (info.menuItemId.indexOf(ContextMenu.PROJECT_ID_PREFIX) === 0) {
      var projectName = info.menuItemId.substring(ContextMenu.PROJECT_ID_PREFIX.length, info.menuItemId.length);
      Projects.sendTab(tab, projectName);
    }
  }
}

// Attach the listener for click on menu items
chrome.contextMenus.onClicked.addListener(ContextMenu.onClick);
