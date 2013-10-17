var libassert   = require('assert'),
    libfs       = require('fs'),
    libpath     = require('path'),
    modulepath  = libpath.join(process.cwd(), 'lib', 'yrb2json'),
    prespath    = libpath.join(process.cwd(), 'tests', 'fixtures', 'example.pres'),
    jsonpath    = libpath.join(process.cwd(), 'tests', 'fixtures', 'example.json');

describe('yrb2json', function () {

    it('output looks as expected', function () {
        var yrb2json    = require(modulepath),
            pres        = libfs.readFileSync(prespath, 'utf8').toString(),
            json        = libfs.readFileSync(jsonpath, 'utf8').toString();

        // remove formatting
        json = JSON.stringify(JSON.parse(json));

        libassert.equal(yrb2json(pres), json);
    });

});
