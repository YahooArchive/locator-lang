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

    this.describe = {
        summary: description,
        extensions: ['js', 'json', 'json5', 'pres'],
        options: config || {}
    };

}

PluginClass.prototype = {

    fileUpdated: function (evt, api) {

        var file = evt.file,
            bundle = evt.bundle,
            source_path = file.fullPath,
            bundleName = file.bundleName,
            filename = libpath.basename(file.relativePath, '.' + file.ext),
            moduleName = (bundleName + '-lang-' + filename).toLocaleLowerCase(),
            format = this.describe.options.format,
            defaultLang = this.describe.options.defaultLang || 'en',
            destination_path,
            langBundleName,
            match,
            lang;

        match = filename.match(LANG_TAG_RE);
        lang  = (match && match[0].slice(1)) || defaultLang;

        // hoge_ja-JP => hoge
        langBundleName = filename.replace(LANG_TAG_RE, '');

        // Guarantee that build files will always include lang tags.
        // hoge => hoge_ja-JP.js
        // piyo_ja-JP => piyo_ja-JP.js
        destination_path = moduleName + (match ? '' : '_' + defaultLang) + '.js';

        // only files within the lang folder will be evaluated as lang bundles
        if (libpath.basename(libpath.dirname(source_path)) !== 'lang') {
            return;
        }

        return api.promise(function (fulfill, reject) {
            var langEntries,
                source;

            try {
                source = libfs.readFileSync(source_path, 'utf8').toString();
                if (file.ext === 'pres') {
                    source = yrb2json(source);
                }
                langEntries = json5.parse(source);
            } catch (e) {
                throw new Error('Error parsing lang bundle: ' +
                        file.relativePath, '. ' + e);
            }
            // provisioning lang entries for server side use
            bundle.lang = bundle.lang || {};
            bundle.lang[lang] = bundle.lang[lang] || {};
            bundle.lang[lang][langBundleName] = langEntries;

            if (format) {
                // trying to write the destination file which will fulfill or reject the initial promise
                api.writeFileInBundle(bundleName, destination_path,
                    require('./formats/' + format)(bundleName, langBundleName, moduleName, langEntries, lang))
                    .then(fulfill, reject);
            } else {
                fulfill();
            }

        });

    }

};

module.exports = PluginClass;
