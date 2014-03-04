locator-lang
============

Language bundle compiler for [Locator][].

When you plug the locator-lang plugin instance into the locator instance,
locator will identify any `lang/*.js`, `lang/*.json`, or `lang/*.json5` files
as language bundles, and provision them as locator bundle objects.

This plugin also supports the compilation of language bundles into formats that
can be delivered to the client. Currently, the only supported format is the
[YUI][] module format, but we plan to add more output formats (e.g., amd, es6,
etc) in the future.

[![Build Status](https://travis-ci.org/yahoo/locator-lang.png?branch=master)](https://travis-ci.org/yahoo/locator-lang)

[Locator]: https://github.com/yahoo/locator
[YUI]: https://github.com/yui/yui3


Installation
------------

Install using npm:

```shell
$ npm install locator-lang
```


Usage
-----

The examples below show how to use the plugin with locator.

### Compiling language bundles

```javascript
var Locator = require('locator'),
    LocatorLang = require('locator-lang'),
    loc = new Locator();

// using locator-lang plugin
loc.plug(new LocatorLang());
```

This example compiles any lang file into memory and exposes it through
`loc.getBundle('<bundleName>').lang['<lang>']['<langBundleName>']`.

- `bundleName` is the name that locator assigns to every bundle based on the
  npm package name
- `lang` is the language tag (e.g., `en-US`)
- `langBundleName` is derived from the file name from where the language
  entries were extracted.

### Configuration Options

There are few configuration arguments that can be passed when creating a plugin instance. Here is an example:

```javascript
var Locator = require('locator'),
    LocatorLang = require('locator-lang'),
    loc = new Locator({ buildDirectory: 'build' });

// using locator-lang plugin
loc.plug(new LocatorLang({
	format: 'yui',
	defaultLang: 'en',
    transpiler: 'yrb',
    whitelist: ['en', 'es', 'fr']
}));
```

#### `transpiler` configuration

As today, only one transpiler called `yrb` is supported, by default it will apply
a simple `JSON.parse`.

YRB pattern strings are externalized into resource bundles and localized by
translators, while the arguments and locale are provided by the software at
runtime. The use of patterns enables localization in meaningful translation
units (at least complete sentences) with reordering of arguments and omission
of arguments that are not relevant to some languages.

This transpiler relies on [intl-messageformat][] to parse YRB pattern strings
into JavaScript that can be used to create [language resource bundles][] which
are ultimately used to fill localized templates.

[intl-messageformat]: http://github.com/yahoo/intl-messageformat
[language resource bundles]: http://yuilibrary.com/yui/docs/intl/index.html#yrb

#### `format` configuration

The only format supported as today is `yui`. In this example above, each language bundle will be compiled into files containing [YUI][] modules under the `build` folder.

#### `defaultLang` configuration

This value defines what language to use when a lang bundle source file does not
include the locale as part of the filename. In this example above, for a file like
`path/lang/foo.json`, a new file will be generated as `foo_en.js`.

#### `whitelist` configuration

The `whitelist` configuration specifies an array of required language bundles. If this value is set, the plugin will complete those language bundles and/or entries in each bundle based on the `defaultLang`. In other words, if you haven't done the translation for a particular languange, the plugin will fallback to the default language bundle by using those values as the values for the missing language. The same happen for individual entries in each language bundle, and the plugin will be able to analyze each file, and fallback to default entries when needed. This guarentee that your application can assume all entries and lang bundles are in place for all the languages in the whitelist configuration.

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/locator-lang/blob/master/LICENSE


Contribute
----------

See the [CONTRIBUTING file][] for info.

[CONTRIBUTING file]: https://github.com/yahoo/locator-lang/blob/master/CONTRIBUTING.md
