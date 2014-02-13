var libassert   = require('assert'),
    libpath     = require('path'),
    mockery     = require('mockery'),
    path        = libpath.join(process.cwd(), 'lib/transpilers/yrb'),
    transpile   = require(path);

describe('YRB to JavaScript transpiler', function () {

    it('throws on non-string input', function () {
        libassert.throws(function () {
            transpile({});
        });
        libassert.throws(function () {
            transpile();
        });
        libassert.doesNotThrow(function () {
            transpile('');
        });
        libassert.doesNotThrow(function () {
            transpile('kamen rider gaim');
        });
    });

    it('returns expected array', function () {
        var pattern = 'miami florida',
            output = transpile(pattern);
        libassert.equal(output.join(','), ['miami florida'].join(','));
    });

    it('returns expected ${variableName}', function () {
        var pattern = 'kamen rider {NAME}',
            output = transpile(pattern);
        libassert.equal(output.join(','), ['kamen rider ', '${NAME}'].join(','));
    });

});
