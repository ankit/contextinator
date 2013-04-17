// Retrieve and parse emails using Gmail Unread RSS feed

var Gmail = {
  // Return the URL for gmail. Currently, only supports the
  // default gmail account
  getUrl: function() {
    var url = "https://mail.google.com/mail/";
    return url;
  },

  // Get the RSS feed URL for Gmail
  getFeedUrl: function(label) {
    // "zx" is a Gmail query parameter that is expected to contain a random
    // string and may be ignored/stripped.
    if (label) {
      return Gmail.getUrl() + "feed/atom/" + label;
    } else {
      return Gmail.getUrl() + "feed/atom/";
    }
  },

  // Not really sure what this is yet.
  // Blatantly copied from the Gmail extension for Chrome
  NSResolver: function (prefix) {
    return 'http://purl.org/atom/ns#';
  },

  // Get the unread emails for the specified project
  get: function(project, callback) {
    var label = Gmail.getLabel(project.apps["gmail"]);
    Gmail.getEmailForLabel(label, function(labelEmails) {
      Gmail.getEmailFromPeople(project.people, function(peopleEmails) {
        if (peopleEmails) {
          labelEmails.push.apply(labelEmails, peopleEmails);
        }

        var emails = [];
        var length = labelEmails.length;
        for (var i = 0; i < length; i++) {
          var j = 0;
          while (j < i) {
            if (labelEmails[i].title === labelEmails[j].title) {
              break;
            }
            j++;
          }

          if (j >= i) {
            emails.push(labelEmails[i]);
          }
        }

        callback(emails);
      });
    });
  },

  // Get the Gmail label from the specified URL. If the url does not
  // point to a label, return null
  getLabel: function(url) {
    if (!url) {
      return null;
    }

    if (url.indexOf("#label") != -1) {
      return url.substring(url.indexOf("#label") + 7, url.length);
    } else {
      return null;
    }
  },

  // Get the unread email for the specified label
  getEmailForLabel: function(label, callback) {
    if (!label) {
      callback([]);
      return;
    }

    Gmail.sendRequest(Gmail.getFeedUrl(label), function(response) {
      callback(Gmail.parseResponse(response));
    });
  },

  // Get the unread emails sent by the specified people
  getEmailFromPeople: function(people, callback) {
    if (!people) {
      callback([]);
      return;
    }

    Gmail.sendRequest(Gmail.getFeedUrl(null), function(response) {
      callback(Gmail.parseResponse(response, _.pluck(people, 'email')));
    });
  },

  // Send request to fetch the email
  sendRequest: function(url, callback) {
    var xhr = new XMLHttpRequest();
    try {
      xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) {
          return;
        }

        if (xhr.responseXML) {
          callback(xhr.responseXML);
        }
      };

      xhr.open("GET", url, true);
      xhr.send(null);
    } catch(e) {
      callback([]);
      console.error("error!");
    }
  },

  // Parse the returned response
  parseResponse: function(xmlDoc, emails) {
    if (!xmlDoc) {
      return [];
    }

    var entriesSet = xmlDoc.evaluate("/gmail:feed/gmail:entry", xmlDoc, Gmail.NSResolver, XPathResult.ANY_TYPE, null);
    var entries = [];
    var entry;

    while ((entry = entriesSet.iterateNext())) {
      var authorEmail = entry.childNodes[13].childNodes[3].textContent;
      if (!emails || emails.indexOf(authorEmail) != -1) {
        entries.push({
          title: entry.childNodes[1].textContent,
          summary: entry.childNodes[3].textContent,
          url: entry.childNodes[5].getAttribute('href'),
          authorName: entry.childNodes[13].childNodes[1].textContent,
          authorEmail: authorEmail,
          modified: moment(entry.childNodes[7].textContent, "YYYY-MM-DDThh:mm:ssZ").fromNow()
        });
      }
    }

    return entries;
  }
}
