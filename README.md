# Contextinator

Divide your web browsing sessions into projects and manage all of their related information.

## Setting up Development Environment:

* Run `bundle install` from the chrome folder.

* Run `guard` from `/chrome` to watch changes to `.less` and `.handlebars`.

* For CSS, we are using [Less](http://lesscss.org/). Edit `.less` files, and they are automatically compiled to `.css`.

* For templating, we are using [Handlebars](http://handlebarsjs.com/). Edit `.handlebars` files and they are automatically compiled to `.js`.

## Code Structure

* `/website` contains the code for the Contextinator website.
* `/icons` contains the source files for the Contexinator Icon.
* `/chrome` contains the source code for the Chrome extension.
    * `/lib`: Third party JavaScript Libraries
    * `/utils`: Functions and objects reused across the extension.
    * `/background`: [Event Pages](http://developer.chrome.com/extensions/event_pages.html)
    * `/browserAction`: Browser Action popup
    * `/content`: Content Script
    * `/jumper`: Quick Switcher
    * `/home`: Project Homepage
    * `/overview`: Projects Overview

## How to contribute?

Go ahead and implement your crazy ideas!
If you don't have one, look up the Issues to see things that need to be fixed or feature ideas.

## License

Dual licensed under the GPL and MIT Licenses.
