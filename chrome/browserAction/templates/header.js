(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['header'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  
  return "project-popup";}

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <h3>\n     ";
  stack1 = depth0.project;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\n      <div>\n        <button class=\"btn btn-info home-btn\">Go to Homepage</button>\n        <button class=\"bookmark btn btn-success\">Bookmark This Tab</button>\n        <button class=\"show-tasks-btn btn btn-primary\">Add Task</button>\n      </div>\n    </h3>\n    <div class=\"tasks-container hide\">\n      <ul class=\"tasks\">\n        <p class=\"lead\">Loading...</p>\n      </ul>\n    </div>\n  ";
  return buffer;}

function program5(depth0,data) {
  
  
  return "\n    <h3>You're not in a project.</h3>\n    <a class=\"create-new-window btn btn-success\" href=\"#\">New Project</a>\n    <a class=\"create-this-window btn btn-success\" href=\"#\">New Project For This Window</a>\n    <a class=\"overview btn\" href=\"#\">Projects Overview</a>\n  ";}

function program7(depth0,data) {
  
  var buffer = "", stack1, foundHelper;
  buffer += "\n          <li class=\"";
  stack1 = depth0.open;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(8, program8, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " project\">\n            <a title=\"Go to this project\" href=\"#\" class=\"project-name\" data-id=\"";
  foundHelper = helpers.id;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" data-project=\"";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">\n              ";
  foundHelper = helpers.name;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\n              ";
  stack1 = depth0.current;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(10, program10, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n            </a>\n          </li>\n        ";
  return buffer;}
function program8(depth0,data) {
  
  
  return "open";}

function program10(depth0,data) {
  
  
  return "\n                <span class=\"active\">(active)</span>\n              ";}

  buffer += "<div class=\"popup ";
  stack1 = depth0.project;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n  ";
  stack1 = depth0.project;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(5, program5, data),fn:self.program(3, program3, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <div class=\"row projects-list\">\n    <div class=\"span5\">\n      <p class=\"lead\">Switch to another Project:</p>\n      <ul class=\"projects\">\n        ";
  stack1 = depth0.projects;
  stack1 = helpers.each.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(7, program7, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </ul>\n    </div>\n  </div>\n</div>\n";
  return buffer;});
})();
