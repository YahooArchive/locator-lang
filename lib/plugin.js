/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true */

"use strict";

var libpath = require('path');

module.exports = {

    fileUpdated: function (evt, api) {

        var self = this,
            file = evt.file,
            source_path = file.fullPath,
            bundleName = file.bundleName,
            langBundleName = libpath.basename(file.relativePath, '.' + file.ext),
            moduleName = bundleName + '-lang-' + langBundleName,
            destination_path = moduleName + '.js';

        // only files within the lang folder will be evaluated as lang bundles
        if (libpath.basename(libpath.dirname(source_path)) !== 'lang') {
            return;
        }

        return api.promise(function (fulfill, reject) {

            var langEntries = require(source_path);

            // trying to write the destination file which will fulfill or reject the initial promise
            api.writeFileInBundle(bundleName, destination_path,
                self._wrapAsYUI(bundleName, langBundleName, moduleName, langEntries))
                .then(function () {
                    // provisioning lang entries for server side use
                    evt.bundle.lang = evt.bundle.lang || {};
                    evt.bundle.lang[langBundleName] = langEntries;
                    // we are now ready to roll
                    fulfill();
                }, reject);

        });

    },

    _wrapAsYUI: function (bundleName, langBundleName, moduleName, langEntries) {

        return [
            'YUI.add("' + moduleName + '",function(Y, NAME){',
            '   Y.Intl.add("' + bundleName + '.' + langBundleName + '", ' + JSON.stringify(langEntries) + ');',
            '}, "", {requires: ["intl"]});'
        ].join('\n');

    }

};
