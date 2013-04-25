// Quick switcher between projects.
var Jumper = function() {
  this.classes = {
    projects: 'contextinator-projects',
    project: 'contextinator-project',
    tab: 'contextinator-tab',
    open: 'contextinator-open',
    search: 'contextinator-search',
    hover: 'contextinator-hover',
    close: 'contextinator-close',
    newProject: 'contextinator-new',
    overview: 'contextinator-overview',
    name: 'contextinator-project-name',
    thumbnail: 'contextinator-thumbnail'
  };

  this.init = function() {
    _.bindAll(this,
      'attachListeners',
      'initProjects',
      'initNewProject',
      'initOverview',
      'load',
      'refresh',
      'show',
      'append',
      'hide',
      'filter',
      'hover',
      'handleKeydown',
      'highlight',
      'forward',
      'back',
      'up',
      'down',
      'select',
      'close',
      'openNewProject',
      'openOverview',
      'closeOverview',
      'isVisible',
      'toggle');

    this.attachListeners();
  };

  this.attachListeners = function() {
    $(document).keydown(_.bind(function(e) {
      if (e.ctrlKey || e.metaKey) {
        return true;
      }

      var tag = e.target.tagName.toLowerCase();
      var blacklist = ['input', 'textarea', 'object', 'embed', 'select'];

      if ($.inArray(tag, blacklist) != -1) {
        return true;
      }

      // ` is the shortcut to activate the jumper
      if (e.keyCode === 192) {
        this.toggle();
      } else if (e.keyCode == 27) {
        this.hide();
      }
    }, this));
  };

  // Initialize the projects
  this.initProjects = function(projects, temporaryWindows) {
    var length = temporaryWindows.length;

    for (var i = 0; i < length; i++) {
      temporaryWindows[i].name = "Untitled Project #" + i;
    }

    projects.push.apply(projects, temporaryWindows);

    // sort the list of projects based on last access time.
    projects = _.sortBy(projects, function(project) {
      if (!project.lastAccessed) {
        return -1;
      } else if (project.height != undefined || project.windowId) {
        return -project.lastAccessed;
      } else {
        return -0.00001 * project.lastAccessed ;
      }
    });

    var length = projects.length;

    // Append the list of projects.
    for (var i = 0; i < length; i++) {
      this.append(projects[i], "project" + i);
    }
  };

  // Initialize the "New Project" link
  this.initNewProject = function(project) {
    var $newProject = $(Handlebars.templates.new({
      project: project
    }));

    this.$projects.prepend($newProject);

    $newProject
      .mouseover(this.hover)
      .click(this.select)
      .keydown(this.handleKeydown);
  };

  // Initialize the overview link
  this.initOverview = function(overviewWindowId) {
    var $overview = $(Handlebars.templates.overview({
      open: overviewWindowId ? true : false
    }));

    this.$projects.prepend($overview);

    $overview
      .mouseover(this.hover)
      .click(this.select)
      .keydown(this.handleKeydown);

    $("." + this.classes.close, $overview)
      .click(this.closeOverview);
  };

  // Load the jumper for the first time
  this.load = function() {
    if (this.loading) {return;}
    this.loading = true;

    this.$container = $("<div>", {
      id: "contextinator-jumper"
    }).appendTo("body");

    this.$projects = $("<span>", {
      "class": this.classes.projects
    }).appendTo(this.$container);

    chrome.storage.local.get(null, _.bind(function(items) {
      var temporaryWindows = items['temporaryWindows'];
      var projects = items['projects'];
      var project = projects[items['active']];
      this.projectName = project ? project.name : null;
      var overviewWindowId = items['overviewWindowId'];
      this.selected = 0;

      this.$projects.html("");

      this.initProjects(projects, temporaryWindows);
      this.initNewProject(project);
      this.initOverview(overviewWindowId);

      this.highlight(3);
      this.loading = false;
    }, this));
  };

  // Refresh the info displayed by the jumper
  this.refresh = function() {
    if (this.loading) {return;}

    if (!this.$container) {
      this.load();
      return true;
    }

    this.loading = true;
    chrome.storage.local.get(null, _.bind(function(items) {
      var temporaryWindows = items['temporaryWindows'];
      var projects = items['projects'];
      var project = projects[items['active']];
      this.projectName = project ? project.name : null;

      var overviewWindowId = items['overviewWindowId'];

      this.$projects.html("");

      this.initProjects(projects, temporaryWindows);
      this.initNewProject(project);
      this.initOverview(overviewWindowId);

      this.highlight(this.selected);
      this.loading = false;
    }, this));
  };

  this.show = function() {
    if (this.$container) {
      this.$container.show();
      this.highlight(3);
    }
  };

  this.append = function(project, id) {
    var template = Handlebars.templates.project;
    var tab = null;
    var open = (project.windowId || project.height != undefined);

    if (project.tabs) {
      var len = project.tabs.length;
      for (var i = 0; i < len; i++) {
        if (project.tabs[i].active) {
          tab = project.tabs[i];
          break;
        }
      }
    }

    var $project = $(template({
      project: project,
      tab: tab,
      open: open,
      id: id
    }));

    this.$projects.append($project);

    $project
      .mouseover(this.hover)
      .click(this.select)
      .keydown(this.handleKeydown);

    $("." + this.classes.thumbnail, $project).mouseover(this.hover);
    $("." + this.classes.thumbnail + " img", $project).mouseover(this.hover);
    $("." + this.classes.close, $project).click(this.close);
  };

  this.handleKeydown = function(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.keyCode === 39 || e.keyCode === 76) {
      this.forward();
    } else if (e.keyCode === 37 || e.keyCode === 72) {
      this.back();
    } else if (e.keyCode === 38 || e.keyCode === 75) {
      this.up();
    } else if (e.keyCode === 40 || e.keyCode === 74) {
      this.down();
    } else if (e.keyCode === 13) {
      this.select();
    } else if (e.keyCode === 192) {
      this.toggle();
    } else if (e.keyCode === 27) {
      this.hide();
    }
  };

  this.hover = function(e) {
    var $target = $(e.target);
    if (!$target.hasClass(this.classes.project)) {
      $target = $target.parent("." + this.classes.project);
    }

    var $projects = $("." + this.classes.project).removeClass(this.classes.hover);
    this.selected = $projects.index($target);
    $target.focus().addClass(this.classes.hover);
  };

  this.hide = function() {
    if (this.$container) {
      this.$container.hide();
      document.activeElement.blur();
    }
  };

  this.filter = function(text) {
    var $projects = $("." + this.classes.project);
    var len = $projects.length;
    text = text.toLowerCase();
    for (var i = 0; i < len; i++) {
      var $project = $($projects[i]);
      if ($project.text().toLowerCase().indexOf(text) == -1) {
        $project.hide();
      } else {
        $project.show();
      }
    }
  };

  this.highlight = function(index) {
    var $projects = $("." + this.classes.project).removeClass(this.classes.hover);
    var length = $projects.length;

    if (index >= length) {
      this.selected = 0;
    } else if (index < 0) {
      this.selected = length - 1;
    } else {
      this.selected = index;
    }

    var $project = $($projects.get(this.selected));
    $project.focus().addClass(this.classes.hover);
  };

  // select the next space to the right
  // TODO(ankit): All of these including forward, back, up and down,
  // need to be optimized. And they need to be combined into a single method.
  this.forward = function() {
    var $projects = $("." + this.classes.project);
    var $current = $($projects.get(this.selected));
    var currentOffset = $current.offset();
    var currentTop = currentOffset.top;
    var currentLeft = currentOffset.left;

    var length = $projects.length;
    var targetIndex = this.selected;
    // random big value
    var minRight = 100000;
    var minLeft = currentLeft;

    for (var i = 0; i < length; i++) {
      var offset = $($projects.get(i)).offset();
      if (offset.top == currentTop && offset.left > currentLeft && offset.left < minRight) {
        targetIndex = i;
        minRight = offset.left;
      } else if (offset.top == currentTop && offset.left < currentLeft && minRight == 100000 && offset.left < minLeft) {
        targetIndex = i;
        minLeft = offset.left;
      }
    }

    this.highlight(targetIndex);
  };

  // select the previous space to the left
  this.back = function() {
    var $projects = $("." + this.classes.project);
    var $current = $($projects.get(this.selected));
    var currentOffset = $current.offset();
    var currentTop = currentOffset.top;
    var currentLeft = currentOffset.left;

    var length = $projects.length;
    var targetIndex = this.selected;
    var maxLeft = -1;

    for (var i = 0; i < length; i++) {
      var offset = $($projects.get(i)).offset();
      if (offset.top == currentTop && offset.left < currentLeft && offset.left > maxLeft) {
        targetIndex = i;
        maxLeft = offset.left;
      } else if (offset.top == currentTop && offset.left > currentLeft && maxLeft == -1) {
        targetIndex = i;
      }
    }

    this.highlight(targetIndex);
  };

  // select the space above the current
  this.up = function() {
    var $projects = $("." + this.classes.project);
    var $current = $($projects.get(this.selected));
    var currentOffset = $current.offset();
    var currentTop = currentOffset.top;
    var currentLeft = currentOffset.left;

    var length = $projects.length;
    var targetIndex = this.selected;
    var maxTop = -1;

    for (var i = 0; i < length; i++) {
      var offset = $($projects.get(i)).offset();
      if (offset.left == currentLeft && offset.top < currentTop && offset.top > maxTop) {
        targetIndex = i;
        maxTop = offset.top;
      } else if (offset.top > currentTop && offset.left == currentLeft && maxTop == -1) {
        targetIndex = i;
      }
    }

    this.highlight(targetIndex);
  };

  // select the space below the current
  this.down = function() {
    var $projects = $("." + this.classes.project);
    var $current = $($projects.get(this.selected));
    var currentOffset = $current.offset();
    var currentTop = currentOffset.top;
    var currentLeft = currentOffset.left;

    var length = $projects.length;
    var targetIndex = this.selected;
    var minBottom = 100000;
    var minTop = currentTop;

    for (var i = 0; i < length; i++) {
      var offset = $($projects.get(i)).offset();
      if (offset.left == currentLeft && offset.top > currentTop && offset.top < minBottom) {
        targetIndex = i;
        minBottom = offset.top;
      } else if (offset.top < currentTop && offset.left == currentLeft && minBottom == 100000 && offset.top < minTop) {
        targetIndex = i;
        minTop = offset.top;
      }
    }

    this.highlight(targetIndex);
  };

  this.select = function() {
    var $projects = $("." + this.classes.project).removeClass(this.classes.hover);
    var $project = $($projects.get(this.selected));

    if ($project.hasClass(this.classes.newProject)) {
      this.openNewProject();
    } else if ($project.hasClass(this.classes.overview)) {
      this.openOverview();
    } else {
      var id = $project.data("id");
      var name = $project.data("name");

      if (id) {
        Projects.getTemporaryWindow(id, _.bind(function(temporaryWindow) {
          Projects.open(temporaryWindow);
          this.hide();
        }, this));
      } else {
        Projects.getByName(name, _.bind(function(project) {
          Projects.open(project);
          this.hide();
        }, this));
      }
    }
  };

  this.openNewProject = function() {
    if (this.projectName) {
      Projects.openNewProject();
    } else {
      Projects.openNewProjectForCurrentWindow();
    }

    this.hide();
  };

  this.close = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var $close = $(e.target);
    if (!$close.hasClass('contextinator-close')) {
      $close = $close.parent('.contextinator-close');
    }

    var $project = $close.parents("." + this.classes.project);
    $project.removeClass(this.classes.open);

    var id = $project.data("id");
    var name = $project.data("name");

    if (id) {
      Projects.getTemporaryWindow(id, _.bind(function(temporaryWindow) {
        Projects.close(temporaryWindow);
        $project.remove();
      }, this));
    } else {
      Projects.getByName(name, _.bind(function(project) {
        Projects.close(project);
      }, this));
    }

    $close.remove();
  };

  this.openOverview = function() {
    Projects.openOverview();
    this.hide();
  };

  this.closeOverview = function(e) {
    e.stopPropagation();
    e.preventDefault();

    var $close = $(e.target);
    if (!$close.hasClass('contextinator-close')) {
      $close = $close.parent('.contextinator-close');
    }

    Projects.closeOverview();
    $close.remove();
  };

  this.isVisible = function() {
    return this.$container && this.$container.is(":visible");
  };

  this.toggle = function() {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  };
};

var jumper;
$(document).ready(function() {
  jumper = new Jumper();
  jumper.init();

  // Listen to requests to refresh / show the jumper
  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request === "reloadJumper") {
      jumper.refresh();
    } else if (request === "showJumper") {
      jumper.show();
    }
  });
});
