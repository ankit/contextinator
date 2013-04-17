(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['addTask'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "checked";}

  buffer += "<div class=\"tasks-header\">\n  <div class=\"row-fluid\">\n    <div class=\"span3 name-container\">\n      <input type=\"text\" class=\"name\" placeholder=\"Add a new task...\">\n    </div>\n  </div>\n\n  <form class=\"add-task-controls form-inline\">\n    <input type=\"text\" class=\"url\" placeholder=\"Add a URL for the task...\">\n    <textarea class=\"notes\" name=\"notes\" placeholder=\"Notes...\"></textarea>\n    <div class=\"task-actions\">\n      <button class=\"add-task btn btn-small btn-primary\">Save</button>\n      <button class=\"cancel-task btn btn-small\">Cancel</button>&nbsp;&nbsp;\n      <label class=\"checkbox include-tab-label\">\n        <input class=\"include-tab\" ";
  stack1 = depth0.checkSaveCurrentTab;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " type=\"checkbox\"> Save Current Tab\n      </label>\n    </div>\n  </form>\n</div>\n";
  return buffer;});
})();
