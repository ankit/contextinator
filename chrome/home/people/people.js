// Adding / removing people
var People = {
  // Add a person to a project
  add: function(email, project, callback) {
    if (!project.people) {
      project.people = [];
    }

    var len = project.people.length;
    var id = 1;
    if (len > 0) {
      id = project.people[len - 1].id + 1;
    }

    var person = {
      id: id,
      email: email
    };

    project.people.push(person);

    Projects.save(project, function() {
      callback({
        project: project,
        person: person
      });
    });
  },

  // Remove a person from a project
  remove: function(id, project, callback) {
    if (!project.people) {
      callback();
    }

    var updatedPeople = [];
    var length = project.people.length;

    for (var i = 0; i < length; i++) {
      if (project.people[i].id != id) {
        updatedPeople.push(project.people[i]);
      }
    }

    project.people = updatedPeople;

    Projects.save(project, function() {
      callback({project: project});
    });
  }
}
