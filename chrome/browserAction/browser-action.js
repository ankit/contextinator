// Initializes and manages the Browser Action popup

$(document).ready(function() {
  var action = new BrowserAction();
  action.init();
});

var BrowserAction = function() {
  this.templates = {
    header: Handlebars.templates.header,
    tasks: Handlebars.templates.tasks
  };

  // Initialize the browser action
  this.init = function() {
    _.bindAll(this,
      'openNewProject',
      'openNewProjectForCurrentWindow',
      'initNotes',
      'openHomepage',
      'openProject',
      'openOverview',
      'bookmark',
      'showTasks',
      'refresh');

    Handlebars.registerPartial('task', Handlebars.templates.task);

    chrome.storage.local.get(null, _.bind(function(items) {
      var projects = items["projects"];
      var active = items["active"];
      var project = projects[active];
      this.projectName = project ? project.name : null;
      var temporaryWindows = items["temporaryWindows"];
      var length = temporaryWindows.length;

      for (var i = 0; i < length; i++) {
        temporaryWindows[i].name = "Untitled Project #" + i;
      }

      projects.push.apply(projects, temporaryWindows);

      projects = _.sortBy(projects, function(project) {
        if (!project.lastAccessed) {
          return -1;
        } else if (project.height != undefined || project.windowId) {
          return -project.lastAccessed;
        } else {
          return -0.00001 * project.lastAccessed ;
        }
      });

      projects[0].current = true;

      var length = projects.length;
      for (var i = 0; i < length; i++) {
        if (projects[i].height != undefined || projects[i].windowId) {
          projects[i].open = true;
        }
      }

      $("body").html(this.templates.header({
        projects: projects,
        project: project
      }));

      this.tasks = new Tasks();

      if (project) {
        this.refresh(null, project, _.bind(function() {
          this.tasks.init({
            projectName: project.name,
            $container: $(".tasks-container"),
            $tasks: $(".tasks"),
            checkSaveCurrentTab: true
          });
        }, this));
      }

      this.initNotes();

      $(".open-project-btn").click(this.openProject);
      $(".overview").click(this.openOverview);
      $(".create-this-window").click(this.openNewProjectForCurrentWindow);
      $(".create-new-window").click(this.openNewProject);
      $(".home-btn").click(this.openHomepage);
      $(".project-name").click(this.openProject);
      $(".bookmark").click(this.bookmark);
      $(".send").click(this.send);
      $('.show-tasks-btn').click(this.showTasks);
      $('form').submit(function(e) {e.preventDefault();});
    }, this));
  };

  // fill the notes field if the user has some text selected
  this.initNotes = function() {
    chrome.windows.getCurrent({populate: true}, function(aWindow) {
      var len = aWindow.tabs.length;
      for (var i = 0; i < len; i++) {
        if (aWindow.tabs[i].active) {
          var tab = aWindow.tabs[i];
          chrome.tabs.sendMessage(tab.id, "getSelection", function(selection) {
            if (selection) {
              $('.notes').attr("value", selection.text);
            }
          });
          break;
        }
      }
    });
  };

  this.openNewProject = function(e) {
    Projects.openNewProject();
  };

  // Opens a new tab for creating a new project
  this.openNewProjectForCurrentWindow = function(e) {
    Projects.openNewProjectForCurrentWindow();
  };

  // open the projects overview
  this.openOverview = function(e) {
    var $btn = $(e.target)
    $btn.addClass('disabled').html('Opening...');
    Projects.openOverview();
  };

  // open the homepage for the currently active project
  this.openHomepage = function(e) {
    e.preventDefault();
    $(e.target).addClass("disabled").text("Opening...");

    Projects.getByName(this.projectName, function(project) {
      Projects.openHomepage(project);
    });
  };

  // open the the selected project
  this.openProject = function(e) {
    e.preventDefault();
    var $link = $(e.target);
    var name = $link.data("project");
    var id = $link.data("id");
    if (id) {
      Projects.getTemporaryWindow(id, function(temporaryWindow) {
        Projects.open(temporaryWindow);
      });
    } else {
      Projects.getByName(name, function(project) {
        if (!project) {
          return;
        }

        Projects.open(project);
      });
    }
  };

  // Bookmark the current page in the selected project
  this.bookmark = function(e) {
    e.preventDefault();
    var $btn = $(e.target);
    $btn.html("Bookmarking...").attr("disabled", true);

    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      $btn.html("Bookmarked");
      Bookmarks.newForCurrentTab(project);
    }, this));
  };

  this.showTasks = function(e) {
    var $target = $(e.target);

    if ($target.hasClass('show-tasks-btn')) {
      $('.projects-list').hide();
      $('.tasks-container').show();
      $(e.target).text("Show Projects")
        .removeClass('show-tasks-btn');
      $('.name').focus();
    } else {
      $('.projects-list').show();
      $('.tasks-container').hide();
      $(e.target).text("Add Task")
        .addClass('show-tasks-btn');
    }
  }

  this.refresh = function(e, project, callback) {
    $(".tasks").html(this.templates.tasks(this.tasks.sort(project.tasks)));
    $(".task-notes").expander();
    if (callback) {
      callback();
    }
  };
}
