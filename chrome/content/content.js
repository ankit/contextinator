// content.js
// Called when a page has started loading

var projects, active, apps, appId;

init();

function init() {
  chrome.storage.local.get(null, function(items) {
    projects = items["projects"],
    active = projects[items["active"]],
    apps = items["apps"];
    appId = getApp();

    if (appId) {
      $(document).ready(function() {
        if (active) {
          initContextinatorBar();
          goToContext();
        }
      });
    }
  });
}

// Checks if it is a supported contextual app. If yes, return the app object
// from the store
function getApp() {
  var url = window.location.href;
  for (var id in apps) {
    if (url.indexOf(apps[id].search_uri) == 0) {
      return id;
    }
  }

  return null;
}

// initialize the context for the specified app
function goToContext() {
  var url = decodeURIComponent(window.location.href);
  var app = apps[appId];

  // If it is a url to be ignored, return;
  if (url.indexOf(app.ignore) != -1) {
    return false;
  }

  var contextUrl = active.apps[appId];

  // Don't redirect if it is a "subcontext" i.e. a sub URL within the
  // current context.
  if (url.indexOf(contextUrl) != -1) {
    return true;
  }

  // Redirect to the right context
  if (contextUrl && contextUrl != '') {
    window.location.href = contextUrl;
  }

  return true;
}

// Show the contextinator bar up top
function initContextinatorBar() {
  $("body").append(Handlebars.templates.bar({project: active}))
    .css({
      top: 30,
      position: "relative"
    });

  $(".contextinator-bar-project").click(function(e) {
    e.preventDefault();
    window.location.reload();
  });

  $(".contextinator-bar-save").click(function(e) {
    e.preventDefault();
    save(window.location.href);
  });

  $(".contextinator-bar-clear").click(function(e) {
    e.preventDefault();
    save('');
  });
}

// Save the current location of the app for the current project
function save(url) {
  active.apps[appId] = url;
  Projects.saveApp(active.name, appId, url, function() {
    var msg = (url != '') ? "Set project view: " + url : "Successfully reset project view";
    alert(msg);
  });
}

// Open the homepage of the project
function home() {
  chrome.extension.sendMessage({action: "showHome"}, function(){});
}

// Listen to requests from elsewhere
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request === "getSelection") {
    sendResponse({
      text: window.getSelection().toString()
    });
  }
});
