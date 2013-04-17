// Logging for data collection (not being used any longer).
var Logging = {
  logURL: "//",

  // All trackable actions in our logging mechanism
  actions: {
    projectOpen: 1,
    projectClose: 2,
    projectHomepageOpen: 3,
    projectNewpageOpen: 4,
    projectRemove: 5,
    projectNew: 6,
    projectHomepageFocus: 7,
    projectFocus: 8,
    nonProjectFocus: 9,

    personRemove: 10,
    personNew: 11,

    tabOpen: 12,
    tabRemove: 13,

    bookmarkNew: 14,
    bookmarkOpen: 15,
    bookmarkRemove: 16,

    overviewOpen: 17,
    overviewClose: 18,
    overviewSubviewChange: 19,
    overviewFocus: 20,

    jumperOpen: 22,
    jumperClose: 23,

    taskNew: 24,
    taskRemove: 25,
    taskFlag: 26,
    taskUnflag: 27,
    taskComplete: 28,
    taskIncomplete: 29,
    taskOpen: 30,

    appNew: 31,
    appOpen: 32,
    appRemove: 33,

    emailOpen: 34,
    projectHomepageSubviewChange: 35,
    appVisit: 36,
    browserLaunch: 37,
    nonProjectClose: 38,
    consentSubmitted: 39,
    install: 40
  },

  // All views supported
  views: {
    browserAction: 0,
    homepage: 1,
    overview: 2,
    jumper: 3,
    contextMenu: 4
  },

  init: function(callback) {
    if (!callback) {
      callback = function(){};
    }

    chrome.storage.local.get("userId", function(items) {
      if (!items["userId"]) {
        Logging.initUserId();
      } else {
        Logging.userId = items["userId"];
      }

      callback();
    });
  },

  track: function(action, data) {
    var unixTimestamp = parseInt(new Date().getTime() / 1000);
    chrome.storage.local.get("log", function(items) {
      var log;
      if (!items["log"]) {
        log = [];
      } else {
        log = items["log"];
      }

      var entry = {
        timestamp: unixTimestamp,
        action: action,
        userId: Logging.userId,
        data: data
      };

      log.push(entry);
      console.log(entry);
      chrome.storage.local.set({"log": log});

      $.post(Logging.logURL, {
        timestamp: entry.timestamp,
        action: entry.action,
        userId: entry.userId,
        data: JSON.stringify(entry.data)
      }, function(data) {});
    });
  },

  // Create the user id if it doesn't already exist.
  // Uses the current unix timestamp for the ID
  initUserId: function() {
    Logging.userId = parseInt(new Date().getTime() / 1000);
    chrome.storage.local.set({"userId": Logging.userId});
  }
}
