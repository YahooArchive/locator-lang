var assert      = require('assert'),
    libpath     = require('path'),
    mockery     = require('mockery'),
    modulepath  = libpath.join(process.cwd(), 'lib', 'plugin'),

    Plugin,
    yrbInvoked,
    evt,
    api;

var FORMAT               = 'yui',
    LANG_ENTRIES         = {};


describe('Plugin', function () {

    describe('in the constructor', function () {
        beforeEach(function () {
            Plugin = require(modulepath);
        });

        it('uses the config as options', function () {
            var config = {},
                instance = new Plugin(config);

            assert.strictEqual(instance.describe.options, config);
            assert.strictEqual('en', config.defaultLang);
        });
    });

    describe('in the fileUpdated method', function () {

        beforeEach(function (done) {
            mockery.registerMock('fs', {
                readFileSync: function () {
                    return {
                        toString: function () {}
                    };
                }
            });
            mockery.registerMock('path', {
                basename: function (basename) {
                    return basename;
                },
                dirname: function (dirname) {
                    return dirname;
                }
            });
            mockery.registerMock('json5', {
                parse: function () {
                    return LANG_ENTRIES;
                }
            });
            mockery.registerMock('./yrb2json', function (yrb) {
                yrbInvoked = true;
            });

            mockery.registerAllowable('../package.json');
            mockery.registerAllowable(modulepath);

            mockery.enable({ useCleanCache: true });
            Plugin = require(modulepath);
            mockery.disable();

            evt = {
                file: {
                    ext: 'json',
                    fullPath: 'lang',
                    bundleName: 'bundlename',
                    relativePath: 'filename'
                },
                bundle: {}
            };

            done();
        });

        afterEach(function (done) {
            mockery.deregisterAll();
            done();
        });

        it('only files within a "lang" directory are considered', function () {
            evt.file.fullPath = 'lang';
            new Plugin().fileUpdated(evt, api);
            assert.equal(Object.keys(evt.bundle.lang).length, 1);

            evt.file.fullPath = 'notlang';
            new Plugin().fileUpdated(evt, api);
            assert.equal(Object.keys(evt.bundle.lang).length, 1);
        });

        describe('after the bundle is generated', function () {
            it('the lang entries are made available in memory', function () {
                new Plugin().fileUpdated(evt, api);
                assert.strictEqual(
                    evt.bundle.lang.en.filename,
                    LANG_ENTRIES
                );
            });

            it('the yrb parser is invoked for pres files', function () {
                evt.file.ext = 'pres';
                yrbInvoked = false;
                new Plugin().fileUpdated(evt, api);
                assert(yrbInvoked);
            });
        });
    });

    describe('in the bundleUpdated method', function () {

        var output;

        beforeEach(function (done) {
            mockery.registerAllowable('../package.json');
            mockery.registerAllowable(modulepath);

            mockery.enable({ useCleanCache: true });
            Plugin = require(modulepath);
            mockery.disable();

            evt = {
                bundle: {
                    bundleName: 'app',
                    lang: {
                        en: {
                            user: {
                                foo: 'FOO',
                                bar: 'BAR',
                                baz: 'BAZ'
                            }
                        }
                    }
                }
            };

            output = {};

            api = {
                writeFileInBundle: function (bundleName, destination_path, content) {
                    output[bundleName + '/' + destination_path] = content;
                    return Promise.resolve({});
                }
            };

            done();
        });

        afterEach(function (done) {
            mockery.deregisterAll();
            done();
        });

        describe('the name of the build file', function () {
            it('defaults to the "en" lang tag', function () {
                new Plugin({
                    format: FORMAT
                }).bundleUpdated(evt, api);
                assert.equal(Object.keys(output).length, 1);
                assert.equal(output['app/app-lang-user_en.js'].indexOf('{"foo":"FOO","bar":"BAR","baz":"BAZ"}') > 0, true);
            });

            it('allows for a configurable default lang tag missing', function () {
                new Plugin({
                    defaultLang: 'ja-JP',
                    format: FORMAT
                }).bundleUpdated(evt, api);
                assert.equal(Object.keys(output).length, 1);
                assert.equal(output['app/app-lang-user_en.js'].indexOf('{"foo":"FOO","bar":"BAR","baz":"BAZ"}') > 0, true);
            });

            it('allows whitelist bundle fallback', function () {
                new Plugin({
                    whitelist: ['en', 'fr'],
                    format: FORMAT
                }).bundleUpdated(evt, api);
                assert.equal(Object.keys(output).length, 2);
                assert.equal(output['app/app-lang-user_en.js'].indexOf('{"foo":"FOO","bar":"BAR","baz":"BAZ"}') > 0, true);
                assert.equal(output['app/app-lang-user_fr.js'].indexOf('{"foo":"FOO","bar":"BAR","baz":"BAZ"}') > 0, true);
            });

            it('allows whitelist entry fallback', function () {
                evt.bundle.lang.fr = {
                    user: {
                        foo: 'FOO-IN-FRENCH'
                    }
                };
                new Plugin({
                    whitelist: ['en', 'fr'],
                    format: FORMAT
                }).bundleUpdated(evt, api);
                assert.equal(Object.keys(output).length, 2);
                assert.equal(output['app/app-lang-user_en.js'].indexOf('{"foo":"FOO","bar":"BAR","baz":"BAZ"}') > 0, true);
                assert.equal(output['app/app-lang-user_fr.js'].indexOf('{"foo":"FOO-IN-FRENCH","bar":"BAR","baz":"BAZ"}') > 0, true);
            });
        });

    });

});
