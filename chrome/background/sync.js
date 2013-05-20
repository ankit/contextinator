// Keep local data synced with sync storage.
//
// - Update chrome.storage.sync every N minutes.
// - Keep track of any changes to the sync storage and applying them to
//   chrome.storage.local
//
// We use this approach instead of using chrome.storage.sync for two reasons:
//
// - To keep within the limits of number of API calls allowed to
//   chrome.storage.sync
//   (http://developer.chrome.com/extensions/storage.html#property-sync)
//
// - Selectively sync data to keep within data limits.
//   We sync selective properties of "projects"
//
var Sync = {
  // Currently interval is arbitrarily set to 10 minutes
  INTERVAL: '300000',

  SYNCED_PROJECT_PROPERTIES: [
    "apps",
    "bookmarkFolderId",
    "currentTaskId",
    "emails",
    "name",
    "people",
    "tabs",
    "tasks"
  ],

  PROJECT_NAME_PREFIX: "_p_",

  // Push the local storage to sync storage
  // TODO: Only push if any changes are detected.
  push: function() {
    console.log("Pushing data to sync storage");

    chrome.storage.local.get(null, function(localItems) {
      var localProjects = localItems["projects"];
      var syncProjects = [];
      var syncItems = {};

      _.each(localProjects, function(localProject) {
        var syncProject = {};
        _.each(localProject, function(value, key) {
          if (Sync.SYNCED_PROJECT_PROPERTIES.indexOf(key) != -1) {
            syncProject[key] = value;
          }
        });

        // prepending project names with "_p_"
        syncItems[Sync.PROJECT_NAME_PREFIX + syncProject.name] = syncProject;
      });

      syncItems.bookmarkFolderId = localItems.bookmarkFolderId;

      chrome.storage.sync.clear(function() {
        chrome.storage.sync.set(syncItems, function() {
          console.log("Successfully pushed data to sync!");
          chrome.storage.sync.getBytesInUse(function(bytesInUse) {
            console.log(bytesInUse + " bytes are being used in sync storage.\
              The limit is " + chrome.storage.sync.QUOTA_BYTES);
          });
        });
      });
    });
  },

  // Apply changes to sync storage to local storage
  pull: function() {
    console.log("Applying changes from sync to local store");
    chrome.storage.local.get(null, function(localItems) {
      chrome.storage.sync.get(null, function(syncItems) {
        console.log(syncItems);
        localItems.bookmarkFolderId = syncItems.bookmarkFolderId;
        if (!localItems.projects) {
          localItems.projects = {};
        }

        var syncProjectNames = [];

        _.each(syncItems, function(syncProject, key) {
          if (key.indexOf(Sync.PROJECT_NAME_PREFIX) === 0) {
            var projectName = syncProject["name"];
            syncProjectNames.push(projectName);
            var projectFound = false;

            _.each(localItems.projects, function(project, index) {
              if (project.name === projectName) {

                _.each(Sync.SYNCED_PROJECT_PROPERTIES, function(property) {
                  project[property] = syncProject[property];
                });

                localItems.projects[index] = project;
                projectFound = true;
                return;
              }
            });

            if (!projectFound) {
              localItems.projects.push(syncProject);
            }
          }
        });

        localItems.projects = _.filter(localItems.projects, function(project) {
          return syncProjectNames.indexOf(project.name) != -1;
        });

        chrome.storage.local.set(localItems);
      });
    });
  }
}

// Set up the task of updating sync storage
setInterval(Sync.push, Sync.INTERVAL);

// Listen to updates to sync storage
chrome.storage.onChanged.addListener(function(changes, areaName) {
  if (areaName === "sync") {
    console.log("Sync storage updated");
    Sync.pull();
  }
});
