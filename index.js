/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

function PluginClass(config) {

    this.describe = {
        summary: require('./package.json').description,
        extensions: ['js', 'json'],
        options: config || {}
    };

};
PluginClass.prototype = require('./lib/plugin');

module.exports = PluginClass;
