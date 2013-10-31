var parse = require('./lib/parse');

/**
Transpiles a YALA MessageFormat pattern that may contain nested format
elements.
@method transpile
@param {String} pattern A pattern
@return {Object} Transpiled output
**/
module.exports.transpile = function (pattern) {
    if (typeof pattern !== 'string') {
        throw new Error('Only strings can be transpiled');
    }

    return {
        input: pattern,
        js: parse(pattern)
    };
};
