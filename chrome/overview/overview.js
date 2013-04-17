// Initialize and manage the Overview page

$(document).ready(function() {
  var overview = new Overview();
  overview.init();
  jumper.load();

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var tag = document.activeElement.tagName.toLowerCase();
    if (request == "reloadJumper" && tag != "input" && tag != "textarea") {
      overview.show();
    }
  });
});

// The Overview
var Overview = function() {
  this.templates = {
    tasks: Handlebars.templates.tasksInOverview,
    emails: Handlebars.templates.emailsInOverview
  };

  // Initialize the view
  this.init = function() {
    _.bindAll(this,
      'openNewProject',
      'openProject',
      'deleteProject',
      'show',
      'showTasks',
      'showEmails',
      'showFlaggedTasks',
      'showAllTasks',
      'onTaskAdd',
      'onTaskDelete',
      'onTaskComplete',
      'onTaskIncomplete',
      'onTaskFlagged',
      'onTaskUnflagged',
      'getTaskCount',
      'setTaskCount',
      'closeOverview');

    Handlebars.registerPartial('task', Handlebars.templates.task);
    Handlebars.registerPartial('email', Handlebars.templates.email);

    $(".open-project").live("click", this.openProject);
    $(".delete-project").live("click", this.deleteProject);

    $(".show-flagged-tasks").click(this.showFlaggedTasks);
    $(".show-all-tasks").click(this.showAllTasks);
    $(".show-tasks").click(this.showTasks);
    $(".show-emails").click(this.showEmails);
    $(".unread-count, .time").live('click', this.clickProjectHeader);
    $(".new-project").click(this.openNewProject);
    $(".close-overview").click(this.closeOverview);

    this.subView = "tasks";
    this.showingFlaggedTasks = false;
    this.show();
  };

  this.openNewProject = function() {
    Projects.openNewProject();
  };

  // Show the view
  this.show = function() {
    if (this.loading) {return;}
    this.loading = true;

    var $tasksContainer = $(".tasks-section .section-content");
    var $emailContainer = $(".emails-section .section-content");
    var $tasksLoading = $('.tasks-section .loading');
    var $emailLoading = $('.emails-section .loading');

    $tasksContainer.html("");
    $emailContainer.html("");
    $emailLoading.show();
    $tasksLoading.show();

    var allTasksCount = 0;
    var flaggedTasksCount = 0;

    chrome.storage.local.get(null, _.bind(function(items) {
      var projects = items["projects"];
      var active = items["active"];
      var index = 0;
      var length = projects.length;

      // Say that the projects are empty
      if (length == 0) {
        $(".no-projects").show();
      }

      // Sort the projects based on last access time
      projects = _.sortBy(projects, function(project) {
        if (!project.lastAccessed) {
          return -1;
        } else {
          return -project.lastAccessed;
        }
      });

      $tasksLoading.hide();

      _.each(projects, _.bind(function(project) {
        var lastAccessed;
        if (project.lastAccessed) {
          lastAccessed = moment(project.lastAccessed).fromNow();
        }

        var tasks = new Tasks();
        project.tasks = _.filter(project.tasks, function(task) {
          return task;
        });

        var tasksCount = _.filter(project.tasks, function(task) {
          return !task.completed;
        }).length;

        var flaggedCount = _.filter(project.tasks, function(task) {
          return task.flagged;
        }).length;

        allTasksCount += tasksCount;
        flaggedTasksCount += flaggedCount;

        $tasksContainer.append(this.templates.tasks({
          project: project,
          tasks: tasks.sort(project.tasks),
          incompleteTasksCount: tasksCount,
          lastAccessed: lastAccessed
        }));

        var $project = $(".project[data-project='" + project.name + "']");

        tasks.init({
          projectName: project.name,
          $container: $('.tasks-container', $project),
          $tasks: $('.tasks', $project),
          onTaskAdd: this.onTaskAdd,
          onTaskDelete: this.onTaskDelete,
          onTaskComplete: this.onTaskComplete,
          onTaskIncomplete: this.onTaskIncomplete,
          onTaskFlagged: this.onTaskFlagged,
          onTaskUnflagged: this.onTaskUnflagged
        });

        index++;
      }, this));

      this.setAllTasksCount(allTasksCount);
      this.setFlaggedTasksCount(flaggedTasksCount);
      this.makeCollapsible($('.tasks-section'));

      if (this.showingFlaggedTasks) {
        this.showFlaggedTasks();
      }

      var appendEmails = _.bind(function() {
        var allEmailCount = 0;
        _.each(projects, _.bind(function(project) {
          var emailCount = project.emails.length;
          allEmailCount += emailCount;

          $emailContainer.append(this.templates.emails({
            project: project,
            emailCount: emailCount,
            emails: project.emails
          }));

          $emailLoading.hide();
          this.loading = false;
        }, this));

        this.setAllEmailCount(allEmailCount);
        this.makeCollapsible($('.emails-section'));
      }, this);

      var emailIndex = 0;

      _.each(projects, _.bind(function(project) {
        Gmail.get(project, _.bind(function(emails) {
          projects[projects.indexOf(project)].emails = emails;
          emailIndex++;
          if (emailIndex == length) {
            appendEmails();
          }
        }, this));
      }, this));
    }, this));
  };

  // Open the selected project
  this.openProject = function(e) {
    var $el = $(e.target);
    var $actions = $el.parents('.actions');
    var name = $el.data("project");

    $el.text("Opening...").addClass("disabled");
    $actions.addClass('disabled');

    Projects.getByName(name, function(project) {
      Projects.open(project, true, null, function() {
        $el.text("Home").removeClass("disabled");
        $actions.removeClass('disabled');
      });
    });
  };

  // Delete the selected project
  this.deleteProject = function(e) {
    var name = $(e.target).data("project");

    Projects.getByName(name, _.bind(function(project) {
      if (confirm("Are you sure you want to remove the '" + project.name + "' project?")) {
        Projects.remove(project, _.bind(function() {
          alert("Project successfully removed!");
          this.show();
        }, this));
      }
    }, this));
  }

  // Show the tasks container
  this.showTasks = function(e) {
    e.preventDefault();
    $(".show-tasks").parent().addClass('active').siblings().removeClass('active');
    $('.section').hide();
    $('.tasks-section').show();
    $('.nav-tasks').show();
    if (this.showingFlaggedTasks) {
      this.subView = "flaggedTasks";
    } else {
      this.subView = "tasks";
    }
  }

  // Show the emails container
  this.showEmails = function(e) {
    e.preventDefault();
    $(".show-emails").parent().addClass('active').siblings().removeClass('active');
    $('.section').hide();
    $('.emails-section').show();
    $('.nav-tasks').hide();
    this.subView = "email";
  }

  // Only show flagged tasks
  this.showFlaggedTasks = function() {
    $(".show-flagged-tasks").parent().addClass("active").siblings().removeClass("active");
    $(".task:not(.flagged)").hide();

    var id = 0;
    Projects.getAll(function(projects) {
      _.each(projects, function(project) {
        var tasks = _.filter(project.tasks, function(task) {return task && task.flagged;});
        if (tasks.length == 0) {
          $('.project[data-project="' + project.name + '"]').hide();
        }
      });
    });

    if (!this.showingFlaggedTasks) {
      this.showingFlaggedTasks = true;
      this.subView = "flaggedTasks";
    }
  };

  // Show all tasks
  this.showAllTasks = function() {
    $(".show-all-tasks").parent().addClass("active").siblings().removeClass("active");
    $(".project").show();
    $(".task").show();

    this.showingFlaggedTasks = false;
    this.subView = "tasks";
  };

  // Gets the current task count for a project
  this.getTaskCount = function(project) {
    return Math.abs($('.tasks-unread-count[data-name="' + project.name + '"]').text());
  }

  // Sets the task count label for a project
  this.setTaskCount = function(project, count) {
    $('.tasks-unread-count[data-name="' + project.name + '"]').text(count);
  }

  this.getAllTasksCount = function(count) {
    return Math.abs($('.all-tasks-count').text());
  }

  this.setAllTasksCount = function(count) {
    $('.all-tasks-count').text(count);
  }

  this.setFlaggedTasksCount = function(count) {
    $('.flagged-tasks-count').text(count);
  }

  this.getFlaggedTasksCount = function(count) {
    return Math.abs($('.flagged-tasks-count').text());
  }

  this.setAllEmailCount = function(count) {
    $('.all-email-count').text(count);
  }

  this.makeCollapsible = function($el) {
    $el.collapse({
      query: "div h4",
      persist: true
    });
  }

  this.clickProjectHeader = function(e) {
    e.preventDefault();
    $(e.target).parents('a').click();
  }

  this.closeOverview = function(e) {
    Projects.closeOverview();
  }

  // Tasks callbacks

  // Callback when a new task is added
  this.onTaskAdd = function(task, project) {
    var count = this.getTaskCount(project);
    this.setTaskCount(project, count + 1);
    this.setAllTasksCount(this.getAllTasksCount() + 1);
  }

  // Callback when a task is deleted
  this.onTaskDelete = function(task, project) {
    if (task.completed) return;

    var count = this.getTaskCount(project);
    this.setTaskCount(project, count - 1);
    this.setAllTasksCount(this.getAllTasksCount() - 1);

    if (task.flagged) {
      this.setFlaggedTasksCount(this.getFlaggedTasksCount() - 1);
    }
  }

  // Callback when a task is marked as completed
  this.onTaskComplete = function(task, project) {
    var count = this.getTaskCount(project);
    this.setTaskCount(project, count - 1);
    this.setAllTasksCount(this.getAllTasksCount() - 1);
  }

  // Callback when a  task is marked as incomplete
  this.onTaskIncomplete = function(task, project) {
    var count = this.getTaskCount(project);
    this.setTaskCount(project, count + 1);
    this.setAllTasksCount(this.getAllTasksCount() + 1);
  }

  this.onTaskFlagged = function(task, project) {
   this.setFlaggedTasksCount(this.getFlaggedTasksCount() + 1);
  }

  this.onTaskUnflagged = function(task, project) {
   this.setFlaggedTasksCount(this.getFlaggedTasksCount() - 1);
  }
}
