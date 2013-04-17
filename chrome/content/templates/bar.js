(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['bar'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <a href=\"#\" title=\"Refresh this app's view for ";
  stack1 = depth0.project;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"contextinator-bar-project\">";
  stack1 = depth0.project;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.name;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</a>\n    <a href=\"#\" class=\"contextinator-bar-save\">Set this as the project view</a>\n    <a href=\"#\" class=\"contextinator-bar-clear\">Reset project view</a>\n  ";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n    <span>None</span>\n  ";}

  buffer += "<div id=\"contextinator-bar\">\n  Active Project:\n  ";
  stack1 = depth0.project;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;});
})();
