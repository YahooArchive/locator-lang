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
    description = require('../package.json').description;

function PluginClass(config) {

    this.describe = {
        summary: description,
        extensions: ['js', 'json', 'json5'],
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
            langBundleName = filename.indexOf('_') > 0 ? filename.split('_').slice(0, -1).join('_') : filename, // <name>_en-US => <name>
            lang = filename.slice(langBundleName.length + 1, filename.length) || 'en', // <name>_en-US => en-US
            moduleName = (bundleName + '-lang-' + filename).toLocaleLowerCase(),
            destination_path = moduleName + '.js',
            format = this.describe.options.format;

        // only files within the lang folder will be evaluated as lang bundles
        if (libpath.basename(libpath.dirname(source_path)) !== 'lang') {
            return;
        }

        return api.promise(function (fulfill, reject) {
            var langEntries;

            try {
                langEntries = json5.parse(libfs.readFileSync(source_path, 'utf8').toString());
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
