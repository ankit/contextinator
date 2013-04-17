$(document).ready(function() {
  $('#signupforstudy').click(function(e) {
    var subject = "I am interested in the Contextinator research study";
    var body = "Send me more information about it.";
    var url = "mailto:ankit88@vt.edu?subject=" + subject + "&body=" + body;
    window.open(url);
  });

  $("#consent").click(function(e) {
    e.preventDefault();
    e.stopPropagation();

    var name = $.trim($('.name').val());
    var email = $.trim($('.email').val());

    if (name === "") {
      alert("Name cannot be empty!");
    } else if (email === "") {
      alert("Email cannot be empty!");
    }
  });
});

