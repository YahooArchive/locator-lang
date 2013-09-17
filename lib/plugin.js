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
            langBundleName = libpath.basename(file.relativePath, '.' + file.ext),
            moduleName = bundleName + '-lang-' + langBundleName,
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
            bundle.lang[langBundleName] = langEntries;

            if (format) {
                // trying to write the destination file which will fulfill or reject the initial promise
                api.writeFileInBundle(bundleName, destination_path,
                    require('./formats/' + format)(bundleName, langBundleName, moduleName, langEntries))
                    .then(fulfill, reject);
            } else {
                fulfill();
            }

        });

    }

};

module.exports = PluginClass;
