// Initialize and manage the new project page

$(document).ready(function() {
  var create = new Create();
  create.init();
});

var Create = function() {
  this.appTemplate = Handlebars.templates.appInCreate;

  this.init = function() {
    _.bindAll(this,
      'attachListeners',
      'save',
      'cancel');

    this.attachListeners();
    $('.name').focus();
  };

  this.attachListeners = function() {
    $('.save-btn').click(this.save);
    $('.cancel-btn').click(this.cancel);
  };

  // Save a new project
  this.save = function(e) {
    e.preventDefault();

    var name = $('.name').attr("value");

    if (!name || name === "") {
      alert("Project Name cannot be empty!");
      return false;
    }

    Projects.add(name, function() {
      location.href = "../home/home.html";
    });
  };

  this.cancel = function(e) {
    chrome.windows.getCurrent({populate: true}, function(aWindow) {
      if (aWindow.tabs.length == 1) {
        // if only this tab is open, close the entire window
        Projects.close(aWindow);
      } else {
        // else just close this tab.
        window.close();
      }
    });

    return false;
  };
}
