var assert      = require('assert'),
    libpath     = require('path'),
    mockery     = require('mockery'),
    modulepath  = libpath.join(process.cwd(), 'lib', 'plugin'),

    Plugin,
    destinationPath,
    yrbInvoked,
    evt,
    api;

var FORMAT               = 'yui',
    PROMISE_RETURN_VALUE = {},
    LANG_ENTRIES         = {};


describe('Plugin', function () {

    describe('in the constructor', function () {
        beforeEach(function (done) {
            Plugin = require(modulepath);
            done();
        });

        it('uses the config as options', function () {
            var config = {},
                instance = new Plugin(config);

            assert.strictEqual(instance.describe.options, config);
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
            mockery.registerMock('./formats/' + FORMAT, function () {});

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

            api = {
                promise: function (callback) {
                    callback();
                    return PROMISE_RETURN_VALUE;
                },
                writeFileInBundle: function (bundleName, destination_path) {
                    destinationPath = destination_path;
                    return {
                        then: function () {}
                    };
                }
            };

            Plugin.prototype.describe = {
                options: {
                    format: FORMAT
                }
            };

            done();
        });

        afterEach(function (done) {
            mockery.deregisterAll();
            done();
        });

        it('only files within a "lang" directory are considered', function () {
            evt.file.fullPath = 'lang';
            assert.strictEqual(
                Plugin.prototype.fileUpdated(evt, api),
                PROMISE_RETURN_VALUE
            );

            evt.file.fullPath = 'notlang';
            assert.strictEqual(
                Plugin.prototype.fileUpdated(evt, api),
                undefined
            );
        });

        describe('the name of the build file', function () {
            it('defaults to the "en" lang tag', function () {
                Plugin.prototype.fileUpdated(evt, api);
                assert.equal(destinationPath, 'bundlename-lang-filename_en.js');
            });

            it('allows for a configurable default lang tag', function () {
                Plugin.prototype.describe.options.defaultLang = 'ja-JP';
                Plugin.prototype.fileUpdated(evt, api);
                assert.equal(destinationPath, 'bundlename-lang-filename_ja-JP.js');
            });

            it('prioritizes the lang tag in the file name over any defaults', function () {
                Plugin.prototype.describe.options.defaultLang = 'ja-JP';
                evt.file.relativePath = 'filename_en-US';
                Plugin.prototype.fileUpdated(evt, api);
                assert.equal(destinationPath, 'bundlename-lang-filename_en-us.js');
            });
        });

        describe('after the bundle is generated', function () {
            it('the lang entries are made available in memory', function () {
                Plugin.prototype.fileUpdated(evt, api);
                assert.strictEqual(
                    evt.bundle.lang.en.filename,
                    LANG_ENTRIES
                );
            });

            it('the yrb parser is invoked for pres files', function () {
                evt.file.ext = 'pres';
                yrbInvoked = false;
                Plugin.prototype.fileUpdated(evt, api);
                assert(yrbInvoked);
            });
        });
    });

});
