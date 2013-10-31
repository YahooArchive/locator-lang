/**
Tokenizes a MessageFormat pattern.
@method tokenize
@param {String} pattern A pattern
@param {Boolean} trim Whether or not the tokens should be trimmed of whitespace
@return {Array} Tokens
**/
module.exports = function tokenize (pattern, trim) {
    var bracketRE   = /[{}]/g,
        tokens      = [],
        balance     = 0,
        startIndex  = 0,
        endIndex,
        substr,
        match;

    while (match = bracketRE.exec(pattern)) {
        // Keep track of balanced brackets
        balance += match[0] === '{' ? 1 : -1;

        // Imbalanced brackets detected (e.g. "}hello{", "{hello}}")
        if (balance < 0) {
            throw new Error('Imbalanced bracket detected at index ' +
                match.index + ' for message "' + pattern + '"');
        }

        // Tokenize a pair of balanced brackets
        if (balance === 0) {
            endIndex = match.index + 1;

            tokens.push(
                pattern.slice(startIndex, endIndex)
            );

            startIndex = endIndex;
        }

        // Tokenize any text that comes before the first opening bracket
        if (balance === 1 && startIndex !== match.index) {
            substr = pattern.slice(startIndex, match.index);
            if (substr.indexOf('{') === -1) {
                tokens.push(substr);
                startIndex = match.index;
            }
        }
    }

    // Imbalanced brackets detected (e.g. "{{hello}")
    if (balance !== 0) {
        throw new Error('Brackets were not properly closed: ' + pattern);
    }

    // Tokenize any remaining non-empty string
    if (startIndex !== pattern.length) {
        tokens.push(
            pattern.slice(startIndex)
        );
    }

    if (trim) {
        tokens = tokens.map(function (token) {
            return token.replace(/^\s*/, '').replace(/\s*$/, '');
        });
    }

    return tokens;
};
