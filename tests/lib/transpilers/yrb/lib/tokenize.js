var libassert   = require('assert'),
    libpath     = require('path'),
    path        = libpath.join(process.cwd(), 'lib/transpilers/yrb/lib/tokenize'),
    tokenize    = require(path);

describe('YRB tokenize', function () {

    it('throws on unbalanced brackets', function () {
        libassert.throws(function () {
            tokenize('}KAMEN{');
        }, Error);
        libassert.throws(function () {
            tokenize('{{KAMEN}');
        }, Error);
        libassert.throws(function () {
            tokenize('{KAMEN}}');
        }, Error);
    });

    it('does not care about nested brackets', function () {
        libassert.deepEqual(
            tokenize('Kamen {{RIDER}}'),
            ['Kamen ', '{{RIDER}}']
        );
    });

    it('returns the expected tokens', function () {
        libassert.deepEqual(
            tokenize('Kamen {{RIDER}} Gaim'),
            ['Kamen ', '{{RIDER}}', ' Gaim']
        );
        libassert.deepEqual(
            tokenize('{Kamen} {{{RIDER}} Gaim} is awesome {dude}'),
            ['{Kamen}', ' ', '{{{RIDER}} Gaim}', ' is awesome ', '{dude}']
        );
    });

});

