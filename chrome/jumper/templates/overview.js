(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['overview'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "contextinator-hover";}

function program3(depth0,data) {
  
  
  return "\n    <div title=\"Close this project\" class=\"contextinator-close\">\n      <div class=\"contextinator-close-icon\"></div>\n    </div>\n  ";}

  buffer += "<div class=\"contextinator-overview contextinator-project ";
  stack1 = depth0.selected;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(1, program1, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\" tabIndex=0>\n  Projects Overview\n  ";
  stack1 = depth0.open;
  stack1 = helpers['if'].call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data)});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;});
})();
