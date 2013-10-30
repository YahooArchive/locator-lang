module.exports = function (str, trim) {
    var bracketRE   = /[{}]/g,
        tokens      = [],
        balance     = 0,
        startIndex  = 0,
        endIndex,
        substr,
        match;

    while (match = bracketRE.exec(str)) {
        // Keep track of balanced brackets
        balance += match[0] === '{' ? 1 : -1;

        // Imbalanced brackets detected (e.g. "}hello{", "{hello}}")
        if (balance < 0) {
            throw new Error('imbalanced bracket detected at index ' +
                match.index + ' for message "' + str + '"');
        }

        // Tokenize a pair of balanced brackets
        if (balance === 0) {
            endIndex = match.index + 1;

            tokens.push(
                str.slice(startIndex, endIndex)
            );

            startIndex = endIndex;
        }

        // Tokenize any text that comes before the first opening bracket
        if (balance === 1 && startIndex !== match.index) {
            substr = str.slice(startIndex, match.index);
            if (substr.indexOf('{') === -1) {
                tokens.push(substr);
                startIndex = match.index;
            }
        }
    }

    if (startIndex !== str.length) {
        tokens.push(
            str.slice(startIndex)
        );
    }

    if (trim) {
        tokens = tokens.map(function (token) {
            return token.replace(/^\s*/, '').replace(/\s*$/, '');
        });
    }

    return tokens;
};
