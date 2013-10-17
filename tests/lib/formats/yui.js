var libassert   = require('assert'),
    libpath     = require('path'),

    langentries = {
        foo: 'bar',
        hoge: 'piyo'
    },

    modulepath,
    formatter;

describe('Build file formats', function () {

    describe('yui module formatter', function () {

        beforeEach(function (done) {
            modulepath  = libpath.join(process.cwd(), 'lib', 'formats', 'yui.js');
            formatter   = require(modulepath);
            done();
        });

        it('registers the module with YUI', function () {
            libassert(
                /^YUI\.add\("modulename"/.test(
                    formatter('bundlename', 'langbundlename', 'modulename', langentries, 'lang')
                )
            );
        });

        it('registers the lang module with Intl', function () {
            libassert(
                /Y\.Intl\.add\("bundlename\/langbundlename"/.test(
                    formatter('bundlename', 'langbundlename', 'modulename', langentries, 'lang')
                )
            );
        });

        it('adds the lang entries', function () {
            var langEntriesRE = new RegExp(JSON.stringify(langentries));
            libassert(
                langEntriesRE.test(
                    formatter('bundlename', 'langbundlename', 'modulename', langentries, 'lang')
                )
            );
        });
    });

});

