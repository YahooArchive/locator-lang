/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true */

"use strict";

var libpath = require('path'),
    description = require('../package.json').description;

function PluginClass(config) {

    this.describe = {
        summary: description,
        extensions: ['js', 'json'],
        options: config || {}
    };

}

PluginClass.prototype = {

    fileUpdated: function (evt, api) {

        var file = evt.file,
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

            var langEntries = require(source_path);

            // provisioning lang entries for server side use
            evt.bundle.lang = evt.bundle.lang || {};
            evt.bundle.lang[langBundleName] = langEntries;

            if (format) {
                // trying to write the destination file which will fulfill or reject the initial promise
                api.writeFileInBundle(bundleName, destination_path,
                    require('./formats/' + format)(bundleName, langBundleName, moduleName, langEntries))
                    .then(function () {
                        // we are now ready to roll
                        fulfill();
                    }, reject);
            } else {
                fulfill();
            }

        });

    }

};

module.exports = PluginClass;
