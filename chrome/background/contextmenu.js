// Context menu
function updateContextMenu() {
  chrome.contextMenus.removeAll();

  chrome.storage.local.get(["projects", "active"], function(items) {
    var active = items["projects"][items["active"]];

    if (active) {
      chrome.contextMenus.create({
        id: "root",
        title: "Contextinator",
        contexts: ["all"]
      });

      chrome.contextMenus.create({
        id: "bookmark",
        title: "Bookmark in " + active.name,
        contexts: ["all"],
        parentId: "root"
      });
    }
  });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "bookmark") {
    Bookmarks.newFromContextMenu(info, tab);
  }
});
