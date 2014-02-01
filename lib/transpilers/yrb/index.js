/*
 * Copyright 2013 Yahoo! Inc. All rights reserved.
 * Licensed under the BSD License.
 * http://yuilibrary.com/license/
 */

var intlMessageFormat = require('intl-messageformat');

/**
Transpiles a YRB MessageFormat pattern that may contain nested format
elements.
@method transpile
@param {String} str A pattern string
@return {Object} Transpiled output
**/
module.exports = function transpile (str) {
	if (typeof str !== 'string') {
        throw new Error('Only strings can be transpiled instead of ' + str);
    }
    str = intlMessageFormat.parse(str);
    return (typeof str === 'string' ? [str] : str);
};
