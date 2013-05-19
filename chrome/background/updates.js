// Any code for extension updates goes here
// The current extension version
var VERSION = '0.3.7';

// Check if the extension was updated
function checkUpdates() {
  if (chrome.storage.local.get("version", function(data) {
    if (data['version'] != VERSION) {
      chrome.storage.local.set({"version": VERSION});
      showUpdateNotification();
    }
  }));
}

// Show the notification popup on version update (with the changelog)
function showUpdateNotification() {
  var notification = webkitNotifications.createHTMLNotification(
    'background/notification.html'
  );
  notification.show();
}
