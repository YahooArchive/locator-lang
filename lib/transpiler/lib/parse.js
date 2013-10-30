var tokenize = require('./tokenize');

function getFormatElementContent (formatElement) {
    return formatElement.replace(/^{\s*/, '').replace(/\s*}$/, '');
}

function containsFormatElement (str) {
    return str.indexOf('{') >= 0;
}

function messageParser (str, match) {
    var parsed = {
        type: this.type,
        valueName: match[1],
        options: tokenize(match[2] || '', true)
    };

    if (this.post) {
        parsed = this.post(parsed);
    }

    return parsed;
}

var FORMATTERS = [
    {
        type: 'string',
        regex: /^[^{]+$/,   // is a plain string
        parse: function (str) {
            return str;
        }
    },
    {
        type: 'variable',
        regex: /^{\s*([A-Z_]+)\s*}$/,
        parse: messageParser,
        post: function (parsed) {
            return '${' + parsed.valueName + '}';
        }
    },
    {
        type: 'select',
        regex: /^{\s*([A-Z_]+)\s*,\s*select\s*,\s*(.*)\s*}$/,
        parse: messageParser,
        post: function (parsed) {
            var tokens = parsed.options,
                value,
                name;

            if (tokens.length % 2) {
                return;
            }

            parsed.options = {};
            while (tokens.length) {
                name  = tokens.shift();
                value = tokens.shift();
                parsed.options[name] = value;
            }

            return parsed;
        }
    },
    {
        type: 'plural',
        regex: /^{\s*([A-Z_]+)\s*,\s*plural\s*,\s*(.*)\s*}$/,
        parse: messageParser,
        post: function (parsed) {
            var tokens = parsed.options,
                value,
                name;

            if (tokens.length % 2) {
                return;
            }

            parsed.options = {};
            while (tokens.length) {
                name  = tokens.shift();
                value = tokens.shift();
                parsed.options[name] = value;
            }

            return parsed;
        }
    }
];

module.exports = function parse (str) {
    var tokens;

    // base case of plain string
    if (!containsFormatElement(str)) {
        return str;
    }

    tokens = tokenize(str);
    tokens.forEach(function (token, index) {
        var parsed;

        // Parse the token if any of the formatters are capable of doing so
        FORMATTERS.some(function (formatter) {
            var match = token.match(formatter.regex);
            if (match) {
                parsed = formatter.parse(token, match);
                tokens[index] = parsed;

                // Recursively parse the option values
                Object.keys(parsed.options || {}).forEach(function (key) {
                    var value = parsed.options[key];
                    value = getFormatElementContent(value);
                    parsed.options[key] = parse(value);
                });
            }

            return match;
        });
    });

    return tokens;
};
