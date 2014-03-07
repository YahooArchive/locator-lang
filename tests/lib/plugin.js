var assert      = require('assert'),
    libpath     = require('path'),
    mockery     = require('mockery'),
    modulePath  = libpath.join(__dirname, '../../lib/plugin'),
    fixturesPath  = libpath.join(__dirname, '../fixtures'),

    Plugin,
    yrbInvoked,
    evt,
    api;

var FORMAT               = 'yui';


describe('Plugin', function () {

    describe('in the constructor', function () {
        beforeEach(function () {
            Plugin = require(modulePath);
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
            mockery.resetCache();
            Plugin = require(modulePath);

            evt = {
                bundle: {}
            };

            done();
        });

        it('only files within a "lang" directory are considered', function () {
            evt.file = {
                ext: 'json',
                fullPath: fixturesPath + '/lang/filename.json',
                relativePath: 'filename.json'
            };
            new Plugin().fileUpdated(evt, api);
            assert.equal(Object.keys(evt.bundle.lang).length, 1);

            evt.file = {
                ext: 'json',
                fullPath: fixturesPath + '/example.json',
                relativePath: 'example.json'
            };
            new Plugin().fileUpdated(evt, api);
            assert.equal(Object.keys(evt.bundle.lang).length, 1);
        });

        describe('after the bundle is generated', function () {
            it('the lang entries are made available in memory', function () {
                evt.file = {
                    ext: 'json',
                    fullPath: fixturesPath + '/lang/filename.json',
                    relativePath: 'filename.json'
                };
                new Plugin().fileUpdated(evt, api);
                assert.strictEqual(
                    evt.bundle.lang.en.filename.FOO,
                    "foo in english"
                );
            });

            it('the yrb parser is invoked for pres files', function () {
                evt.file = {
                    ext: 'pres',
                    fullPath: fixturesPath + '/lang/fallback.pres',
                    relativePath: 'fallback.pres'
                };
                new Plugin().fileUpdated(evt, api);
                assert.strictEqual(
                    evt.bundle.lang.en.fallback.BAR,
                    "bar in english"
                );
            });
        });
    });

    describe('in the fileUpdated method with requiredLangs', function () {

        var output;

        beforeEach(function (done) {
            mockery.resetCache();
            Plugin = require(modulePath);

            evt = {
                bundle: {
                    name: 'app'
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

        it('defaults to the "en" lang tag', function () {
            evt.file = {
                ext: 'pres',
                fullPath: fixturesPath + '/lang/fallback.pres',
                relativePath: 'fallback.pres'
            };
            new Plugin({
                format: FORMAT,
                requiredLangs: ['en']
            }).fileUpdated(evt, api);
            // output
            assert.equal(Object.keys(output).length, 1);
            assert.equal(output['app/app-lang-fallback_en.js'].indexOf('{"FOO":"foo in english","BAR":"bar in english"}') > 0, true);
            // in memory
            assert.equal(Object.keys(evt.bundle.lang).length, 1);
            assert.equal(evt.bundle.lang.en.fallback.FOO, "foo in english");
        });

        it('should fallback for missing lang bundle', function () {
            evt.file = {
                ext: 'pres',
                fullPath: fixturesPath + '/lang/fallback.pres',
                relativePath: 'fallback.pres'
            };
            new Plugin({
                format: FORMAT,
                requiredLangs: ['en', 'es']
            }).fileUpdated(evt, api);
            // output
            assert.equal(Object.keys(output).length, 2);
            assert.equal(output['app/app-lang-fallback_en.js'].indexOf('{"FOO":"foo in english","BAR":"bar in english"}') > 0, true);
            assert.equal(output['app/app-lang-fallback_es.js'].indexOf('{"FOO":"foo in english","BAR":"bar in english"}') > 0, true);
            // in memory
            assert.equal(Object.keys(evt.bundle.lang).length, 2);
            assert.equal(evt.bundle.lang.en.fallback.FOO, "foo in english");
            assert.equal(evt.bundle.lang.es.fallback.FOO, "foo in english");
        });

        it('should fallback for missing entry in memory without writting the file', function () {
            evt.file = {
                ext: 'pres',
                fullPath: fixturesPath + '/lang/fallback.pres',
                relativePath: 'fallback.pres'
            };
            new Plugin({
                format: FORMAT,
                requiredLangs: ['en', 'fr']
            }).fileUpdated(evt, api);
            // output
            assert.equal(Object.keys(output).length, 1);
            assert.equal(output['app/app-lang-fallback_en.js'].indexOf('{"FOO":"foo in english","BAR":"bar in english"}') > 0, true);
            // in memory
            assert.equal(Object.keys(evt.bundle.lang).length, 2);
            assert.equal(Object.keys(evt.bundle.lang.en.fallback).length, 2);
            assert.equal(evt.bundle.lang.en.fallback.FOO, "foo in english");
            assert.equal(evt.bundle.lang.en.fallback.BAR, "bar in english");
            // french is read from disk but no completed since it is suppose to
            // be analyzed in another tick when the plugin picks it up
            assert.equal(Object.keys(evt.bundle.lang.fr.fallback).length, 1);
            assert.equal(evt.bundle.lang.fr.fallback.FOO, "foo in french");
        });

        it('should fallback for missing entry when writting the uncomplete file', function () {
            evt.file = {
                ext: 'pres',
                fullPath: fixturesPath + '/lang/fallback_fr.pres',
                relativePath: 'fallback_fr.pres'
            };
            new Plugin({
                format: FORMAT,
                requiredLangs: ['en', 'fr']
            }).fileUpdated(evt, api);
            // output
            assert.equal(Object.keys(output).length, 1);
            assert.equal(output['app/app-lang-fallback_fr.js'].indexOf('{"FOO":"foo in french","BAR":"bar in english"}') > 0, true);
            // in memory
            assert.equal(Object.keys(evt.bundle.lang).length, 2);
            assert.equal(evt.bundle.lang.fr.fallback.FOO, "foo in french");
            assert.equal(evt.bundle.lang.fr.fallback.BAR, "bar in english");
        });

        it('should ignore langs that are not in the list', function () {
            evt.file = {
                ext: 'pres',
                fullPath: fixturesPath + '/lang/fallback_fr.pres',
                relativePath: 'fallback_fr.pres'
            };
            new Plugin({
                format: FORMAT,
                requiredLangs: ['en']
            }).fileUpdated(evt, api);
            // output
            assert.equal(Object.keys(output).length, 0);
            // in memory
            assert.equal(evt.bundle.lang, undefined);
        });

    });

});
