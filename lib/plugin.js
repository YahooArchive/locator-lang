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

    fileUpdated: function (evt, api) {

        var my = this,
            file = evt.file,
            bundle = evt.bundle,
            bundleName = bundle.name,
            filename = this._getLangBundleName(file.fullPath),
            defaultLang = this.describe.options.defaultLang,
            requiredLangs = this.describe.options.requiredLangs,
            format = this.describe.options.format,
            formatter = format && require('./formats/' + format),
            langBundleName,
            moduleName,
            match,
            lang;

        // only lang files should be analyzed
        if (!filename) {
            return;
        }

        match = filename.match(LANG_TAG_RE);
        lang  = (match && match[0].slice(1)) || defaultLang;
        moduleName = (bundleName + '-lang-' + filename).toLocaleLowerCase();

        // hoge_ja-JP => hoge
        langBundleName = filename.replace(LANG_TAG_RE, '');

        // if requiredLangs is set, only files in those langs will be analyzed
        if (requiredLangs && requiredLangs.indexOf(lang) === -1) {
            return;
        }

        // provisioning lang entries for server side use
        bundle.lang = bundle.lang || {};
        bundle.lang[defaultLang] = bundle.lang[defaultLang] || {};
        bundle.lang[lang] = bundle.lang[lang] || {};

        return new Promise(function (fulfill, reject) {
            var promises = [],
                langEntries,
                defaultLangEntries,
                destinationPath;

            langEntries = my._getLangEntries(file.fullPath, file.ext);

            if (requiredLangs) {
                if (lang !== defaultLang) {
                    defaultLangEntries = bundle.lang[defaultLang][langBundleName];
                    if (!defaultLangEntries) {
                        try {
                            defaultLangEntries = my._getLangEntries(libpath.join(libpath.dirname(file.fullPath),
                                    langBundleName + '.' + file.ext), file.ext);
                        } catch (e1) {
                            try {
                                defaultLangEntries = my._getLangEntries(libpath.join(libpath.dirname(file.fullPath),
                                        langBundleName + '_' + defaultLang + '.' + file.ext), file.ext);
                            } catch (e2) {
                                throw new Error('Error locating the default entries for lang bundle "' +
                                        langBundleName + '" for bundle "' + bundleName + '"');
                            }
                        }
                    }
                    if (requiredLangs.indexOf(lang) >= 0) {
                        if (my._completeLangEntries(langEntries, defaultLangEntries)) {
                            debug('entries in lang bundle "%s" for lang "%s" were completed based on default lang "%s"',
                                    langBundleName, lang, defaultLang);
                        }
                    }
                } else {
                    // complete missing lang bundles
                    requiredLangs.forEach(function (lang) {
                        var sourcePath;

                        bundle.lang[lang] = bundle.lang[lang] || {};
                        if ((lang === defaultLang) || (bundle.lang[lang][langBundleName])) {
                            return; // not need to complete
                        }

                        sourcePath = libpath.join(libpath.dirname(file.fullPath), langBundleName + '_' + lang + '.' + file.ext);
                        try {
                            bundle.lang[lang][langBundleName] = my._getLangEntries(sourcePath, file.ext);
                        } catch (e2) {
                            debug('all entries in lang bundle "%s" for lang "%s" were completed ' +
                                    'based on default lang "%s"', langBundleName, lang, defaultLang);
                            bundle.lang[lang][langBundleName] = langEntries;
                            destinationPath = (bundleName + '-lang-' + langBundleName) + '_' + lang + '.js';
                            // writting file to disk
                            promises.push(api.writeFileInBundle(
                                bundleName,
                                destinationPath,
                                formatter(bundleName, langBundleName,
                                    (bundleName + '-lang-' + langBundleName + '_' + lang).toLocaleLowerCase(), langEntries, lang)
                            ));
                        }
                    });
                }
            }

            bundle.lang[lang][langBundleName] = langEntries;
            destinationPath = (bundleName + '-lang-' + langBundleName) + '_' + lang + '.js';
            // writting file to disk
            promises.push(api.writeFileInBundle(
                bundleName,
                destinationPath,
                formatter(bundleName, langBundleName, moduleName, langEntries, lang)
            ));

            return Promise.all(promises).then(fulfill, reject);
        });

    },

    _getLangEntries: function (file, ext) {
        var transpiler = this.describe.options.transpiler,
            source,
            langEntries,
            token;

        try {
            source = libfs.readFileSync(file, 'utf8').toString();
            if (ext === 'pres') {
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
                    file, '. ' + (e.stack || e));
        }
        return langEntries;
    },

    _completeLangEntries: function (langEntries, defaultLangEntries) {
        var token,
            completed;

        for (token in defaultLangEntries) {
            if (defaultLangEntries.hasOwnProperty(token)) {
                if (!langEntries[token]) {
                    completed = true;
                    langEntries[token] = defaultLangEntries[token];
                }
            }
        }
        return completed;
    },

    _getLangBundleName: function (file) {
        var name = libpath.basename(file, libpath.extname(file));
        // only files within the lang folder will be evaluated as lang bundles
        return (libpath.basename(libpath.dirname(file)) === 'lang') && name;
    }

};

module.exports = PluginClass;
