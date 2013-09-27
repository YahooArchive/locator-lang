/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE.txt file for terms.
 */

/*jslint nomen:true, node:true */

"use strict";

module.exports = function (bundleName, langBundleName, moduleName, langEntries, lang) {

    return [
        'YUI.add("' + moduleName + '",function(Y, NAME){',
        '   Y.Intl.add("' + bundleName + '.' + langBundleName + '", "' + lang + '", ' + JSON.stringify(langEntries) + ');',
        '}, "", {requires: ["intl"]});'
    ].join('\n');

};
