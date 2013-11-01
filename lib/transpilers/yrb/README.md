# YALA Transpiler

YALA pattern strings are externalized into resource bundles and localized by
translators, while the arguments and locale are provided by the software at
runtime. The use of patterns enables localization in meaningful translation
units (at least complete sentences) with reordering of arguments and omission
of arguments that are not relevant to some languages.

This transpiler parses YALA pattern strings into JavaScript that can be used to
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
