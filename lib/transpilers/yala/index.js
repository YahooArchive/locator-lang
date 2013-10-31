/*
 * Copyright 2013 Yahoo! Inc. All rights reserved.
 * Licensed under the BSD License.
 * http://yuilibrary.com/license/
 */

var parse = require('./lib/parse');

/**
Transpiles a YALA MessageFormat pattern that may contain nested format
elements.
@method transpile
@param {String} pattern A pattern
@return {Object} Transpiled output
**/
module.exports = function transpile (pattern) {
    if (typeof pattern !== 'string') {
        throw new Error('Only strings can be transpiled');
    }

    return {
        input: pattern,
        js: parse(pattern)
    };
};
