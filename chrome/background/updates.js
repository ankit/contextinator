// Any code for extension updates goes here
// The current extension version
var VERSION = '0.4';

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
  var notification = chrome.notifications.create("survey", {
    type: "basic",
    title: "Contextinator Survey",
    message: "Help us do research and improve Contextinator by completing this short survey (about 10 questions). Thank you!",
    buttons: [{
      title: "Fill Survey"
    }],
    priority: 2,
    iconUrl: "images/icon48.png"
  }, function(){});
}

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  if (notificationId === "survey") {
    window.open("https://virginiatech.qualtrics.com/SE/?SID=SV_bBkMq6KYCC4hV3f");
  }
})
