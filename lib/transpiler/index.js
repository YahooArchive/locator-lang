var parse = require('./lib/parse');

module.exports.transpile = function (message) {
    if (typeof message !== 'string') {
        return new Error('Only strings can be transpiled');
    }

    return {
        message: message,
        js: parse(message)
    };
};
