// Manages the tasks UI and tasks local storage

var Tasks = function() {
  this.templates = {
    task: Handlebars.templates.task,
    add: Handlebars.templates.addTask
  };

  this.init = function(options) {
    _.bindAll(this,
      'attachListeners',
      'getTaskIndex',
      'toggle',
      'remove',
      'open',
      'flag',
      'sort',
      'add',
      'cancel',
      'showAdd',
      'clearCompletedTasks'
    );

    this.projectName = options.projectName;
    this.$container = options.$container;
    this.$tasks = options.$tasks;

    if (options.onTaskAdd) {
      this.onTaskAdd = options.onTaskAdd;
    }
    if (options.onTaskDelete) {
      this.onTaskDelete = options.onTaskDelete;
    }
    if (options.onTaskComplete) {
      this.onTaskComplete = options.onTaskComplete;
    }
    if (options.onTaskIncomplete) {
      this.onTaskIncomplete = options.onTaskIncomplete;
    }
    if (options.onTaskUpdate) {
      this.onTaskUpdate = options.onTaskUpdate;
    }
    if (options.onTaskFlagged) {
      this.onTaskFlagged = options.onTaskFlagged;
    }
    if (options.onTaskUnflagged) {
      this.onTaskUnflagged = options.onTaskUnflagged;
    }

    this.$container.prepend(this.templates.add({
      checkSaveCurrentTab: options.checkSaveCurrentTab
    }));

    this.attachListeners();
  };

  // Attach listeners to the ui
  this.attachListeners = function() {
    $(".task-name, .task-url", this.$container).click(this.open);
    $(".toggle", this.$container).click(this.toggle);
    $(".close", this.$container).click(this.remove);
    $(".flag", this.$container).click(this.flag);

    $(".clear", this.$container).click(this.clearCompletedTasks);
    $(".name", this.$container).keyup(this.add).focus(this.showAdd);
    $(".add-task", this.$container).click(this.add);
    $(".cancel-task", this.$container).click(this.cancel);
  };

  this.getTaskIndex = function(project, id) {
    var len = project.tasks.length;
    for (var i = 0; i < len; i++) {
      if (project.tasks[i] && project.tasks[i].id == id) {
        return i;
      }
    }

    return -1;
  };

  // Mark a task as complete or incomplete
  this.toggle = function(e) {
    var $target = $(e.target);
    var $task = $target.parents(".task");

    var id = $target.data("id");
    var status = e.target.checked;

    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      var taskIndex = this.getTaskIndex(project, id);
      if (taskIndex == -1) {
        return;
      }

      project.tasks[taskIndex].completed = status;
      Projects.save(project);

      var task = project.tasks[taskIndex];

      if (this.onTaskUpdate) {
        this.onTaskUpdate(task, project);
      }

      if (status && this.onTaskComplete) {
        this.onTaskComplete(task, project);
      } else if (!status && this.onTaskIncomplete) {
        this.onTaskIncomplete(task, project);
      }
    }, this));

    if (status) {
      $task.addClass("completed");
    } else {
      $task.removeClass("completed");
    }
  };

  // Open a task's url
  this.open = function(e) {
    var $target = $(e.target);

    if (!$target.hasClass("task")) {
      $target = $target.parents(".task");
    }

    var id = $target.data("id");

    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      var taskIndex = this.getTaskIndex(project, id);
      if (taskIndex == -1) {
        return;
      }

      if (project.tasks[taskIndex].url) {
        Projects.open(project, false, project.tasks[taskIndex].url);
      }
    }, this));

    return false;
  };

  // Remove a task from a project
  this.remove = function(e) {
    e.preventDefault();

    var id = $(e.target).data("id");
    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      var taskIndex = this.getTaskIndex(project, id);
      if (taskIndex == -1) {
        return;
      }

      var task = project.tasks[taskIndex];
      project.tasks.splice(taskIndex, 1);
      Projects.save(project);

      if (this.onTaskDelete) {
        this.onTaskDelete(task, project);
      }

      if (this.onTaskUpdate) {
        this.onTaskUpdate(task, project);
      }
    }, this));

    $(".task[data-id=" + id + "]", this.$container).remove();
  };

  // Flag or unflag a task
  this.flag = function(e) {
    e.preventDefault();

    var $target = $(e.target);
    if (!$target.hasClass("flag")) {
      $target = $target.parent(".flag");
    }

    var id = $target.data("id");

    var flagValue;
    if ($target.data("value")) {
      flagValue = false;
    } else {
      flagValue = true;
    }

    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      var taskIndex = this.getTaskIndex(project, id);
      if (taskIndex == -1) {
        return;
      }

      project.tasks[taskIndex].flagged = flagValue;
      var task = project.tasks[taskIndex];

      if (flagValue) {
        if (this.onTaskFlagged) {
          this.onTaskFlagged(task, project);
        }
      } else {
        if (this.onTaskUnflagged) {
          this.onTaskUnflagged(task, project);
        }
      }

      Projects.save(project);

      if (this.onTaskUpdate) {
        this.onTaskUpdate(task, project);
      }
    }, this));

    var $task = $(".task[data-id=" + id + "]", this.$container);
    var $flag = $('.flag', $task);

    $flag.data("value", flagValue);

    if (flagValue) {
      $task.addClass("flagged");
      $flag.attr('title', 'Unflag');
    } else {
      $task.removeClass("flagged");
      $flag.attr('title', 'Flag');
    }
  };

  // Sort the tasks
  this.sort = function(tasks) {
    tasks = _.filter(tasks, function(task) { return task; });
    return _.sortBy(tasks, function(task) {
      if (task.completed) {
        return -0.00001 * task.createdAt;
      } else if (task.flagged) {
        return -2 * task.createdAt;
      } else {
        return -task.createdAt;
      }
    });
  };

  // Add a new task
  this.add = function(e) {
    if (e.type == "keyup" && e.keyCode != 13) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    var $name = $(".name", this.$container);
    var $date = $(".date", this.$container);
    var $notes = $(".notes", this.$container);
    var $url = $(".url", this.$container);

    var text = $.trim($name.attr('value')),
        notes = $.trim($notes.attr('value')),
        url = $.trim($url.attr('value'));

    if (text === '') {
      return;
    }

    var shouldIncludeTab = $(".include-tab", this.$container).get(0).checked;

    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      if (!project.tasks) {
        project.tasks = [];
      }

      var task = {
        name: text,
        notes: notes,
        createdAt: new Date().getTime()
      };

      var len = project.tasks.length;
      project.currentTaskId = project.currentTaskId ? project.currentTaskId + 1 : len;
      task.id = project.currentTaskId;

      var continueTaskAdd = _.bind(function() {
        project.tasks.push(task);

        var $task = $(this.templates.task(task));
        $task.prependTo(this.$tasks);

        $(".task-name, .task-url", $task).click(this.open);
        $(".toggle", $task).click(this.toggle);
        $(".close", $task).click(this.remove);
        $(".flag", $task).click(this.flag);

        Projects.save(project);

        if (this.onTaskAdd) {
          this.onTaskAdd(task, project);
        }

        if (this.onTaskUpdate) {
          this.onTaskUpdate(task, project);
        }
      }, this);

      if (shouldIncludeTab) {
        chrome.windows.getCurrent({populate: true}, function(currentWindow) {
          var len = currentWindow.tabs.length;
          for (var i = 0; i < len; i ++) {
            if (currentWindow.tabs[i].highlighted) {
              task.url = decodeURIComponent(currentWindow.tabs[i].url);
              continueTaskAdd();
              break;
            }
          }
        });
      } else {
        task.url = url;
        continueTaskAdd();
      }
    }, this));

    $name.attr('value', '');
    $notes.attr('value', '');
    $url.attr('value', '');
  };

  // Cancel adding a new task
  this.cancel = function(e) {
    e.preventDefault();
    $('.name, .notes', this.$container).val('');
    $('.add-task-controls', this.$container).hide();
  };

  // Show the add controls
  this.showAdd = function() {
    $('.add-task-controls', this.$container).show();
  },

  // Clear completed tasks
  this.clearCompletedTasks = function() {
    Projects.getByName(this.projectName, _.bind(function(project) {
      if (!project) {
        return;
      }

      var len = project.tasks.length;
      var updatedTasks = [];

      for (var i = 0; i < len; i++) {
        if (!project.tasks[i] || project.tasks[i].completed) {
        } else {
          updatedTasks.push(project.tasks[i]);
        }
      }

      project.tasks = updatedTasks;
      Projects.save(project);

      $(".completed", this.$container).remove();
    }, this));
  }
}
