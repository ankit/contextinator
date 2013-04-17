// Accepting the user's consent. If the user has already consented, update the UI
$(document).ready(function(e) {
  $("#consent").click(function(e) {
    var name = $.trim($('.name').val());
    var email = $.trim($('.email').val());
    var timestamp = parseInt(new Date().getTime() / 1000);

    if (name === "" || email === "") return;

    $("#consent").html("Thanks for submitting your consent! You can now start using the tool").attr('disabled', true);
    Consent.submit(name, email, timestamp);
  });

  Consent.getStatus(function(status) {
    if (status) {
      $("#consent").html("Thanks for submitting your consent!").attr('disabled', true);
      $('.form-actions').hide();
    }
  });
});
