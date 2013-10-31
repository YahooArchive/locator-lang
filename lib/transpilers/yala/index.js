var parse = require('./lib/parse');

module.exports.transpile = function (pattern) {
    if (typeof pattern !== 'string') {
        throw new Error('Only strings can be transpiled');
    }

    return {
        input: pattern,
        js: parse(pattern)
    };
};
