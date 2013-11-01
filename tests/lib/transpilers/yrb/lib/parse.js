/* jslint maxlen: 999 */

var libassert   = require('assert'),
    libpath     = require('path'),
    path        = libpath.join(process.cwd(), 'lib/transpilers/yrb/lib/parse'),
    parse       = require(path);

describe('YRB parse', function () {

    it('parses basic string format', function () {
        var parsed = parse('{KAMEN} {RIDER} is {STRONGER} than you!');
        libassert.deepEqual(parsed, [
            '${KAMEN}',
            ' ',
            '${RIDER}',
            ' is ',
            '${STRONGER}',
            ' than you!',
        ]);
    });

    it('parses basic plural format', function () {
        var parsed = parse('There {NUM_RIDERS, plural, one {is only one} other {are #}} kamen rider(s)');
        libassert.deepEqual(parsed, [
            'There ',
            {
                type: 'plural',
                valueName: 'NUM_RIDERS',
                options: {
                    one: 'is only one',
                    other: 'are ${#}'
                }
            },
            ' kamen rider(s)'
        ]);
    });

    it('parses basic select format', function () {
        var parsed = parse('Kamen rider is {LEVEL, select, good {awesome} better {very awesome} best {awesome-possum} other {amaaazing}}!!');
        libassert.deepEqual(parsed, [
            'Kamen rider is ',
            {
                type: 'select',
                valueName: 'LEVEL',
                options: {
                    good: 'awesome',
                    better: 'very awesome',
                    best: 'awesome-possum',
                    other: 'amaaazing'
                }
            },
            '!!'
        ]);
    });

    it('parses basic time format, defaulting to medium if a format is not specified', function () {
        var parsed;

        parsed = parse('Today is {TIME, time, long}.');
        libassert.deepEqual(parsed, [
            'Today is ',
            {
                type: 'time',
                valueName: 'TIME',
                format: 'long'
            },
            '.'
        ]);

        parsed = parse('Today is {TIME, time}.');
        libassert.deepEqual(parsed, [
            'Today is ',
            {
                type: 'time',
                valueName: 'TIME',
                format: 'medium'
            },
            '.'
        ]);
    });

    it('parses basic date format, defaulting to medium if a format is not specified', function () {
        var parsed;

        parsed = parse('Today is {TIME, date, short}.');
        libassert.deepEqual(parsed, [
            'Today is ',
            {
                type: 'date',
                valueName: 'TIME',
                format: 'short'
            },
            '.'
        ]);

        parsed = parse('Today is {TIME, date}.');
        libassert.deepEqual(parsed, [
            'Today is ',
            {
                type: 'date',
                valueName: 'TIME',
                format: 'medium'
            },
            '.'
        ]);
    });

    it('parses basic number format', function () {
        var parsed = parse('There are {POPULATION, number, integer} people in {CITY}.');
        libassert.deepEqual(parsed, [
            'There are ',
            {
                type: 'number',
                valueName: 'POPULATION',
                format: 'integer'
            },
            ' people in ',
            '${CITY}',
            '.'
        ]);
    });

    it('parses complex pattern with string, plural, and select formats', function () {
        var parsed = parse('{TRAVELLERS} {TRAVELLER_COUNT, plural, one {est {GENDER, select, female {allée} other {allé}}} other {sont {GENDER, select, female {allées} other {allés}}}} à {CITY}.');
        libassert.deepEqual(parsed, [
            '${TRAVELLERS}',
            ' ',
            {
                type: 'plural',
                valueName: 'TRAVELLER_COUNT',
                options: {
                    one: [
                        'est ',
                        {
                            type: 'select',
                            valueName: 'GENDER',
                            options: {
                                female: 'allée',
                                other: 'allé'
                            }
                        }
                    ],
                    other: [
                        'sont ',
                        {
                            type: 'select',
                            valueName: 'GENDER',
                            options: {
                                female: 'allées',
                                other: 'allés'
                            }
                        }
                    ]
                }
            },
            ' à ',
            '${CITY}',
            '.'
        ]);

    });

});
