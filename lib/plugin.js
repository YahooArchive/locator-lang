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
            filename = libpath.basename(file.relativePath, '.' + file.ext),
            transpiler = this.describe.options.transpiler,
            defaultLang = this.describe.options.defaultLang,
            langBundleName,
            match,
            lang;

        match = filename.match(LANG_TAG_RE);
        lang  = (match && match[0].slice(1)) || defaultLang;

        // hoge_ja-JP => hoge
        langBundleName = filename.replace(LANG_TAG_RE, '');

        // only files within the lang folder will be evaluated as lang bundles
        if (libpath.basename(libpath.dirname(source_path)) !== 'lang') {
            return;
        }

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
            bundleName = bundle.bundleName,
            format = this.describe.options.format,
            promises = [];

        if (!bundle.lang) {
            return; // no lang bundle to be process
        }

        this._completeMissing(bundle);

        Object.keys(bundle.lang).forEach(function (lang) {

            Object.keys(bundle.lang[lang]).forEach(function (langBundleName) {

                var moduleName = (bundleName + '-lang-' + langBundleName).toLocaleLowerCase(),
                    destination_path = moduleName + '_' + lang + '.js';

                promises.push(new Promise(function (fulfill, reject) {
                    // trying to write the destination file which the content of the lang bundle
                    api.writeFileInBundle(bundleName, destination_path,
                        require('./formats/' + format)(bundleName, langBundleName, moduleName, bundle.lang[lang][langBundleName], lang))
                        .then(fulfill, reject);
                }));

            });

        });

        return Promise.all(promises);
    },

    _completeMissing: function (bundle) {
        var whitelist = this.describe.options.whitelist,
            defaultLang = this.describe.options.defaultLang;

        if (whitelist) {
            whitelist.forEach(function (lang) {

                var defaultLangBundle = bundle.lang[defaultLang],
                    token,
                    bundleName;

                // if the entire lang is missing
                bundle.lang[lang] = bundle.lang[lang] || defaultLangBundle;

                for (bundleName in defaultLangBundle) {
                    if (defaultLangBundle.hasOwnProperty(bundleName)) {

                        // if a lang bundle is missing in a particular lang
                        bundle.lang[lang][bundleName] = bundle.lang[lang][bundleName]
                                || defaultLangBundle[bundleName];

                        for (token in defaultLangBundle[bundleName]) {
                            if (defaultLangBundle[bundleName].hasOwnProperty(token)) {

                                // if a token is missing in a particular lang and particula lang bundle
                                bundle.lang[lang][bundleName][token] = bundle.lang[lang][bundleName][token]
                                        || defaultLangBundle[bundleName][token];
                            }
                        }

                    }
                }

            });
        }
    }

};

module.exports = PluginClass;
