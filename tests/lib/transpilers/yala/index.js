var libassert   = require('assert'),
    libpath     = require('path'),
    mockery     = require('mockery'),
    path        = libpath.join(process.cwd(), 'lib/transpilers/yala'),
    transpile;

describe('YALA to JavaScript transpiler', function () {

    beforeEach(function (done) {
        mockery.registerMock('./lib/parse', function (pattern) {
            return pattern;
        });
        mockery.registerAllowable(path);
        mockery.enable();

        transpile = require(path);

        done();
    });

    afterEach(function (done) {
        mockery.deregisterMock('./lib/parse');
        mockery.disable();

        done();
    });

    it('throws on non-string input', function () {
        libassert.throws(function () {
            transpile({});
        });
        libassert.doesNotThrow(function () {
            transpile('kamen rider gaim');
        });
    });

    it('returns expected object', function () {
        var pattern = 'kamen rider {NAME}',
            output = transpile(pattern);

        libassert.equal(output, pattern);
    });

});
