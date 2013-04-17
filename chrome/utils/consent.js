var Consent = {
  URL: "",

  getStatus: function(callback) {
    chrome.storage.local.get("consent", function(items) {
      callback(items["consent"]);
    });
  },

  submit: function(name, email, timestamp) {
    $.post(Consent.URL, {
      name: name,
      email: email
    }, function() {});

    chrome.storage.local.set({"consent": true});
    Logging.track(Logging.actions.consentSubmitted);
  },

  getRestrictedHtml: function() {
    var $text = $('<p>', {
      html: "You need to submit the consent form to start using Contextinator. Thanks!<br>",
      'class': 'lead'
    });

    var url = 'http://contextinator.cs.vt.edu/consent.html';
    var $btn = $('<button>', {
      'class': 'btn btn-success',
      html: 'View Consent Form'
    }).click(function(e) {
      window.open(url);
    });

    return $text.append($btn);
  }
};
