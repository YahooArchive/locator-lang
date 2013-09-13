locator-lang
============

Language bundles compiler for locator.

[![Build Status](https://travis-ci.org/caridy/locator-lang.png?branch=master)](https://travis-ci.org/caridy/locator-lang)

TBD...

[Locator]: https://github.com/yahoo/locator
[YUI]: https://github.com/yui/yui3


Installation
------------

Install using npm:

```shell
$ npm install locator-lang
```

By installing the module in your express application folder, you should be able to use it thru [Locator][].


Usage
-----

### Integration with `locator`

You can plug the locator lang plugin instance into the locator instance, and locator will be able to analyze every file in your app, and it will compile any `*.js` or `*.json` file under folders called `lang`, considering those files as language bundles, and provisioning them into the server as well as compiling them as YUI modules that can be used at the client side. The example below describes how to use the plugin with locator:

```
var Locator = require('locator'),
    LocatorLang = require('locator-lang'),
    loc = new Locator();

// using locator-lang plugin
loc.plug(new LocatorLang({ buildDirectory: 'build' }));
```

### Server side with `express` and `express-yui`

TBD


### Client side with `yui`

TBD


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/caridy/locator-lang/blob/master/LICENSE


Contribute
----------

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/caridy/locator-lang/blob/master/CONTRIBUTE.md
