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

### Compiling language bundles into memory

```
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

### Compiling language bundles into YUI modules

```
var Locator = require('locator'),
    LocatorLang = require('locator-lang'),
    loc = new Locator({ buildDirectory: 'build' });

// using locator-lang plugin
loc.plug(new LocatorLang({ format: 'yui' }));
```

In this example, each language bundle will be compiled into files containing
[YUI][] modules under the `build` folder.

# YRB Transpiler

YRB pattern strings are externalized into resource bundles and localized by
translators, while the arguments and locale are provided by the software at
runtime. The use of patterns enables localization in meaningful translation
units (at least complete sentences) with reordering of arguments and omission
of arguments that are not relevant to some languages.

This transpiler parses YRB pattern strings into JavaScript that can be used to
create [language resource bundles][] which are ultimately used to fill
localized templates.

[language resource bundles]: http://yuilibrary.com/yui/docs/intl/index.html#yrb

## Supported formats

The following message formats are supported.

### String

A string message format such as `{STRING}` is simply parsed as `${STRING}`.

```
{EMPLOYEE} reports to {MANAGER}.
=> [ '${EMPLOYEE}', ' reports to ', '${MANAGER}' ]
```

### Plural

A plural message format is parsed into a JavaScript object that includes
`type`, `valueName`, and `options` properties.

Within a plural format, the character `#` can be used as a shorthand for
`{argument, number}` using the same argument as for the plural format itself.
This character will be parsed as `${#}` in the final output.

The `other` options is required.

```
{COMPANY_COUNT, plural, one {One company} other {# companies}} published new books.
=> [ {
    type: 'plural',
    valueName: 'COMPANY_COUNT',
    options: {
        one: 'One company',
        other: '${#} companies'
    }
}, ' published new books.' ]
```

### Select

A select message format is parsed into a JavaScript object that includes
`type`, `valueName`, and `options` properties.

The `other` options is required.

```
{NAME} est {GENDER, select, female {allée} other {allé}} à {CITY}.
=> [
    '${NAME}',
    ' est ',
    {
        type: 'select',
        valueName: 'GENDER',
        options: {
            female: 'allée',
            other: 'allé'
        }
    },
    ' à ',
    '${CITY}',
    '.'
]
```


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/locator-lang/blob/master/LICENSE


Contribute
----------

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/yahoo/locator-lang/blob/master/CONTRIBUTE.md
