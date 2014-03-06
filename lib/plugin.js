/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true */

"use strict";

var libfs = require('fs'),
    libpath = require('path'),
    json5 = require('json5'),
    Promise = require('ypromise'),
    yrb2json = require('./yrb2json'),
    debug = require('debug')('locator-lang:plugin'),
    description = require('../package.json').description,

    // This regex only validates the primary language subtag. Subsequent
    // subtags (e.g., script and region) are simply validated against their
    // expected character class.
    //
    // This regex will detect false positives when:
    // 1) uses underscore delimiters in the module name and
    // 2) relies on an unspecified default language and
    // 3) ends with a hyphen-delimited token with 3 characters or less
    //
    // For example, given the file name `foo_bar_baz`, it will identify `baz`
    // as a language tag.
    LANG_TAG_RE = /_(?:i|x|[a-z]{2,3})(?:-[-a-zA-Z\d]+)*$/;

function PluginClass(config) {

    config = config || {};
    config.defaultLang = config.defaultLang || 'en';

    this.describe = {
        summary: description,
        extensions: ['js', 'json', 'json5', 'pres'],
        options: config
    };

}

PluginClass.prototype = {

    fileUpdated: function (evt) {

        var file = evt.file,
            bundle = evt.bundle,
            source_path = file.fullPath,
            filename = this._getLangBundleName(source_path),
            transpiler = this.describe.options.transpiler,
            defaultLang = this.describe.options.defaultLang,
            langBundleName,
            match,
            lang;

        // only lang files should be analyzed
        if (!filename) {
            return;
        }

        match = filename.match(LANG_TAG_RE);
        lang  = (match && match[0].slice(1)) || defaultLang;

        // hoge_ja-JP => hoge
        langBundleName = filename.replace(LANG_TAG_RE, '');

        return new Promise(function (fulfill) {
            var langEntries,
                source,
                token;

            try {
                source = libfs.readFileSync(source_path, 'utf8').toString();
                if (file.ext === 'pres') {
                    source = yrb2json(source);
                }
                langEntries = json5.parse(source);
                // transpiler
                if (transpiler) {
                    transpiler = require('./transpilers/' + transpiler);
                    for (token in langEntries) {
                        if (langEntries.hasOwnProperty(token) && typeof langEntries[token] === 'string') {
                            langEntries[token] = transpiler(langEntries[token]);
                        }
                    }
                }
            } catch (e) {
                throw new Error('Error parsing lang bundle: ' +
                        file.relativePath, '. ' + (e.stack || e));
            }
            // provisioning lang entries for server side use
            bundle.lang = bundle.lang || {};
            bundle.lang[lang] = bundle.lang[lang] || {};
            bundle.lang[lang][langBundleName] = langEntries;

            fulfill();
        });

    },

    bundleUpdated: function (evt, api) {
        var bundle = evt.bundle,
            bundleName = bundle.name,
            format = this.describe.options.format,
            formatter = require('./formats/' + format),
            defaultLang = this.describe.options.defaultLang,
            promises = [],
            files = [];

        if (!bundle.lang) {
            return; // no lang bundle to be process
        }

        Object.keys(evt.files).forEach(function (file) {
            file = this._getLangBundleName(file);
            if (file) {
                files.push(file);
            }
        }, this);

        if (files.length === 0) {
            return; // no lang bundle where changed
        }
        files = files.concat(this._completeMissing(bundle));

        Object.keys(bundle.lang).forEach(function (lang) {

            Object.keys(bundle.lang[lang]).forEach(function (langBundleName) {

                var filename,
                    moduleName,
                    destination_path;

                if (files.indexOf(langBundleName + '_' + lang) >= 0) {
                    filename = langBundleName + '_' + lang;
                } else if (lang === defaultLang && files.indexOf(langBundleName) >= 0) {
                    filename = langBundleName;
                } else {
                    return; // nothing to write since the lang bundle is not changed in this evt
                }

                moduleName = (bundleName + '-lang-' + filename).toLocaleLowerCase(),
                destination_path = (bundleName + '-lang-' + langBundleName) + '_' + lang + '.js';

                debug('writting [%s] in lang "%s"', destination_path, lang);
                // trying to write the destination file which the content of the lang bundle
                promises.push(api.writeFileInBundle(
                    bundleName,
                    destination_path,
                    formatter(bundleName, langBundleName, moduleName, bundle.lang[lang][langBundleName], lang)
                ));

            });

        });
    },

    _getLangBundleName: function (file) {
        var name = libpath.basename(file, libpath.extname(file));
        // only files within the lang folder will be evaluated as lang bundles
        return (libpath.basename(libpath.dirname(file)) === 'lang') && name;
    },

    _completeMissing: function (bundle) {
        var requiredLangs = this.describe.options.requiredLangs,
            defaultLang = this.describe.options.defaultLang,
            files = [];

        if (requiredLangs) {
            requiredLangs.forEach(function (lang) {

                var defaultLangBundle = bundle.lang[defaultLang],
                    token,
                    bundleName;

                if (!bundle.lang[lang]) {
                    debug('entire locale is missing for lang "%s"', lang);
                    bundle.lang[lang] = {};
                }

                for (bundleName in defaultLangBundle) {
                    if (defaultLangBundle.hasOwnProperty(bundleName)) {

                        if (!bundle.lang[lang][bundleName]) {
                            debug('lang bundle "%s" is missing for lang "%s", replicating from default "%s"', bundleName, lang, defaultLang);
                            bundle.lang[lang][bundleName] = defaultLangBundle[bundleName];
                            files.push(bundleName + '_' + lang);
                        }

                        // simple process to avoid completing over and over again
                        if (bundle.lang[lang][bundleName]['@expanded']) {
                            continue;
                        }
                        Object.defineProperty(bundle.lang[lang][bundleName], '@expanded', { value: true });

                        for (token in defaultLangBundle[bundleName]) {
                            if (defaultLangBundle[bundleName].hasOwnProperty(token)) {

                                if (!bundle.lang[lang][bundleName][token]) {
                                    debug('lang entry "%s" is missing in bundle "%s" for lang "%s",' +
                                          ' replicating from default "%s"', token, bundleName, lang, defaultLang);
                                    bundle.lang[lang][bundleName][token] = defaultLangBundle[bundleName][token];
                                }
                            }
                        }

                    }
                }

            });
        }
        return files;
    }

};

module.exports = PluginClass;
