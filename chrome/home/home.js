// Initialize and manage the project homepage

$(document).ready(function() {
  var newtab = new NewTab();
  newtab.init();

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var tag = document.activeElement.tagName.toLowerCase();
    if (request === "reloadJumper" && tag != "input" && tag != "textarea") {
      if (newtab.refreshing != undefined) {
        newtab.refresh();
      } else {
        newtab.refreshing = false;
      }
    }
  });
});

var NewTab = function() {
  this.templates = {
    edit: Handlebars.templates.editProject,
    person: Handlebars.templates.person,
    email: Handlebars.templates.email,
    app: Handlebars.templates.app,
    tab: Handlebars.templates.tab,
    bookmark: Handlebars.templates.bookmark,
    task: Handlebars.templates.task
  };

  // Initialize the new tab page
  this.init = function() {
    _.bindAll(this,
      'init',
      'load',
      'refresh',
      'attachListeners',
      'close',
      'destroy',
      'openOverview',
      'openBookmark',
      'deleteBookmark',
      'addPerson',
      'deletePerson',
      'showSection',
      'deleteTab',
      'selectTab',
      'saveApps',
      'removeCompletedTasks',
      'initTabs',
      'initApps',
      'initBookmarks',
      'initTasks',
      'initEmail',
      'initPeople');

    this.attachListeners();
    this.subView = "tasks";

    $('button').addClass('disabled')
      .attr('disabled', true);

    this.load(_.bind(function(project) {
      $('button:not(.close-btn, .delete-btn)').removeClass('disabled')
        .attr('disabled', false);

      var homepageURL = "chrome-extension://" +
        chrome.i18n.getMessage("@@extension_id") +
        "/home/home.html";

      // Bring back the pinned state of tabs
      chrome.windows.getCurrent({populate: true}, function(currentWindow) {
        var len = project.tabs.length;
        for (var i = 0; i < len; i++) {
          var tab = project.tabs[i];
          if (tab.pinned) {
            chrome.tabs.update(currentWindow.tabs[i].id, {pinned: true});
          }
        }
      });

      var onWindowIdLoad = function() {
        jumper.load();
        $('.delete-btn, .close-btn').removeClass('disabled')
          .attr('disabled', false);
      };

      if (!project.windowId) {
        Projects.setCurrentWindow(project, _.bind(function(response) {
          onWindowIdLoad();
        }, this));
      } else {
        onWindowIdLoad();
      }
    }, this));
  };

  this.initTabs = function(project) {
    if (!project.tabs) { this.setCount('tabs', 0); return; }

    var length = project.tabs.length;
    var $tabs = $('.tabs');
    $tabs.html('');

    for (var i = 0; i < length; i++) {
      $tabs.append(this.templates.tab(project.tabs[i]));
    }

    this.setCount('tabs', length);
  };

  this.initApps = function(project) {
    $('.app-url').attr('value', '');
    $('.app-shortcut').hide();

    var foundApp = false;

    _.each(project.apps, function(url, key) {
      var $url = $('.app-url[data-key="'+ key +'"]');
      $url.attr('value', url);

      var $name = $('.app-name[data-key="'+ key +'"]');
      $name.attr('href', url);

      var $shortcut = $('.app-shortcut[data-key="'+ key +'"]');
      $shortcut.attr('href', url).css('display', 'inline-block');

      foundApp = true;
    });

    if (foundApp) {
      $('.no-apps').hide();
    } else {
      $('.no-apps').show();
    }
  }

  this.initTasks = function(project) {
    this.tasks = new Tasks();
    var tasks = this.tasks.sort(project.tasks);
    var length = tasks.length;

    var $tasks = $('.tasks');
    $tasks.html('');
    $('.tasks-header').html('');

    for (var i = 0; i < length; i++) {
      $tasks.append(this.templates.task(tasks[i]));
    }

    var count = _.filter(tasks, function(task) {
      return !task.completed;
    }).length;

    this.setCount('tasks', count);

    this.tasks.init({
      projectName: project.name,
      $container: $(".tasks-container"),
      $tasks: $(".tasks"),
      onTaskUpdate: this.onTaskUpdate
    });
  };

  this.initBookmarks = function(project) {
    Bookmarks.getAll(project, _.bind(function(bookmarks) {
      var length = bookmarks.length;
      var $bookmarks = $('.bookmarks');
      var $status = $('.bookmarks-status');
      $bookmarks.html('');

      if (length == 0) {
        $status.text('Nothing Bookmarked yet.');
      } else {
        $status.text('');
        for (var i = 0; i < length; i++) {
          $bookmarks.append(this.templates.bookmark(bookmarks[i]));
        }
      }

      this.setCount('bookmarks', length);
    }, this));
  };

  this.initEmail = function(project) {
    Gmail.get(project, _.bind(function(emails) {
      var $emails = $('.emails');
      var $status = $('.emails-status');
      $emails.html('');

      if (!emails) {
        $status.text("Could not connect.");
        this.setCount('emails', 0);
        return;
      } else if (emails.length == 0) {
        $status.text("No Unread Emails.");
        this.setCount('emails', 0);
        return;
      } else {
        $status.text('');

        _.each(emails, _.bind(function(email) {
          $emails.append(this.templates.email(email));
        }, this));

        this.setCount('emails', emails.length);
      }
    }, this));
  };

  this.initPeople = function(project) {
    if (!project.people) {
      this.setCount('people', 0); return false;
    }

    var length = project.people.length;
    var $people = $('.people');
    $people.html('');

    for (var i = 0; i < length; i++) {
      $people.append(this.templates.person(project.people[i]));
    }

    this.setCount('people', length);
  }

  // Load the page content for the first time
  this.load = function(callback) {
    chrome.storage.local.get(null, _.bind(function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];
      this.projectName = project.name;
      this.$container = $(".content");

      $('.brand').text('Home - ' + project.name);
      document.title = project.name + " - Home";

      this.initTasks(project);
      this.initTabs(project);
      this.initApps(project);
      this.initBookmarks(project);
      this.initEmail(project);
      this.initPeople(project);
      callback(project);
    }, this));
  };

  // Refresh the content on the page
  this.refresh = function() {
    if (this.refreshing) {return false;}
    this.refreshing = true;

    chrome.storage.local.get(null, _.bind(function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];

      this.initTasks(project);
      this.initTabs(project);
      this.initBookmarks(project);
      this.initEmail(project);
      this.initApps(project);
      this.refreshing = false;
    }, this));
  };

  // Attach event listeners to UI elements on the page
  this.attachListeners = function() {
    $('.show-overview-btn').click(this.openOverview);
    $('.close-btn').click(this.close);
    $('.delete-btn').click(this.destroy);

    $('.open-bookmark').live('click', this.openBookmark);
    $('.bookmark .contextinator-close').live('click', this.deleteBookmark);
    $('.tab .close').live('click', this.deleteTab);
    $('.tab .tab-link').live('click', this.selectTab);
    $('.add-person').live('keyup', this.addPerson);
    $('.person .close').live('click', this.deletePerson);
    $('.show-section').live('click', this.showSection);
    $('.save-apps').live('click', this.saveApps);
    $('.remove-completed-tasks').live('click', this.removeCompletedTasks);

    $('form').live('submit', function(e) {
      e.preventDefault();
    });
  };

  this.showSection = function(e) {
    e.preventDefault();

    var $el = $(e.target);
    if (!$el.hasClass('show-section')) {
      $el = $el.parent('.show-section');
    }

    var name = $el.data("name");
    $(".project-section").hide();
    $("." + name + "-section").show();
    $el.parent().addClass("active").siblings().removeClass("active");
    this.subView = name;
  };

  // Show the overview window
  this.openOverview = function(e) {
    e.preventDefault();
    var $btn = $(e.target);
    $btn.addClass('disabled').html('Opening...');

    Projects.openOverview(function() {
      $btn.removeClass('disabled').html('Projects Overview');
    });
  };

  // Send request to close a project
  this.close = function(e) {
    chrome.storage.local.get(["projects", "active"], function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];
      if (project) {
        Projects.close(project);
      }
    });
  }

  // Send request to delete a project
  this.destroy = function(e) {
    chrome.storage.local.get(["projects", "active"], function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];

      if (confirm("Are you sure you want to remove the '" + project.name + "' project?")) {
        Projects.remove(project, function() {
          // this usually occurs when a project is opened without any open
          // tabs. Hacky fix.
          window.close();
        });
      }
    });
  }

  // Send request to open a bookmark
  this.openBookmark = function(e) {
    e.preventDefault();
    var $bookmark = $(e.target);
    if (!$bookmark.hasClass('open-bookmark')) {
      $bookmark = $bookmark.parents('.open-bookmark');
    }

    Bookmarks.open($bookmark.data('url'));
  }

  // Send request to delete a bookmark
  this.deleteBookmark = function(e) {
    e.preventDefault();
    var $bookmark = $(e.target);
    $bookmark.parents('li').remove();
    this.decrementCount('bookmarks');

    var id = $bookmark.data("id");
    Bookmarks.remove(id);
  }

  // Send request to remove a tab
  this.deleteTab = function(e) {
    e.preventDefault();
    var $target = $(e.target);
    var url = $target.data('url');
    chrome.extension.sendMessage({action: 'deleteTab', url: url}, function() {});
    $target.parents('li').remove();
    this.decrementCount('tabs');
  }

  // Send request to select a tab in the current window
  this.selectTab = function(e) {
    e.preventDefault();
    var $target = $(e.target);
    var url = $target.data('url');
    chrome.extension.sendMessage({action: 'activateTab', url: url}, function() {});
  }

  // Add a new person to the project
  this.addPerson = function(e) {
    if (e.keyCode == 13) {
      var email = $.trim($(e.target).val());

      if (email === '') {
        return;
      }

      chrome.storage.local.get(["projects", "active"], _.bind(function(items) {
        var projects = items["projects"];
        var project = projects[items["active"]];

        People.add(email, project, _.bind(function(response) {
          $('.people').append(this.templates.person(response.person));
          $('.add-person').val('');
        }, this));
      }, this));

      this.incrementCount('people');
    }
  }

  // Delete a person from the project
  this.deletePerson = function(e) {
    e.preventDefault();

    var id = $(e.target).data('id');

    chrome.storage.local.get(["projects", "active"], function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];

      People.remove(id, project, function(){});
    });

    $('#person' + id).remove();
    this.decrementCount('people');
  }

  // Save all the changes to the apps
  this.saveApps = function(e) {
    var $els = $('.app-url');

    chrome.storage.local.get(["projects", "active"], _.bind(function(items) {
      var projects = items["projects"];
      var project = projects[items["active"]];
      var apps = {};

      _.each($els, _.bind(function(el) {
        var $el = $(el);
        var key = $el.data("key");
        var value = $.trim($el.val());
        if (value != "") {
          apps[key] = value;
        }
      }, this));

      project.apps = apps;
      Projects.save(project);
      this.initApps(project);

      alert("Apps Saved!");
    }, this));
  },

  this.setCount = function(type, count) {
    var $count = $('.' + type + '-count');
    $count.html(count);
  }

  this.incrementCount = function(type) {
    var $count = $('.' + type + '-count');
    var newCount = parseInt($count.text()) + 1;
    $count.html(newCount);
  }

  this.decrementCount = function(type) {
    var $count = $('.' + type + '-count');
    var newCount = parseInt($count.text()) - 1;
    $count.html(newCount);
  }

  this.removeCompletedTasks = function() {
    this.tasks.clearCompletedTasks();
  }

  // Tasks callbacks
  this.onTaskUpdate = function(task, project) {
    var tasksCount = _.filter(project.tasks, function(task) {
      return !task || !task.completed;
    }).length;

    $('.tasks-count').html(tasksCount);
  }
}
