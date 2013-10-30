var tokenize = require('./tokenize');

function getFormatElementContent (formatElement) {
    return formatElement.replace(/^{\s*/, '').replace(/\s*}$/, '');
}

function containsFormatElement (str) {
    return str.indexOf('{') >= 0;
}

function pairedOptionsParser (parsed) {
    var tokens = parsed.tokens,
        value,
        name;

    parsed.tokens   = undefined;
    parsed.options  = {};

    while (tokens.length) {
        name  = tokens.shift();
        value = tokens.shift();
        parsed.options[name] = value;
    }

    return parsed;
}

function messageParser (str, match) {
    var parsed = {
        type: this.type,
        valueName: match[1],
        tokens: tokenize(match[2] || '', true)
    };

    if (this.tokenParser) {
        parsed = this.tokenParser(parsed);
    }

    if (this.postParseFormatter) {
        parsed = this.postParseFormatter(parsed);
    }

    return parsed;
}

// `type` (required): The name of the message format type.
// `regex` (required): The regex used to check if this formatter can parse the message.
// `parse` (required): The main parse method which is given the full message.
// `tokenParser` (optional): Used to parse the remaining tokens of a message (what remains after the variable and the format type).
// `postParseFormatter` (optional): Used to format the output before returning from the main `parse` method.
// `baseCaseFormatter` (optional): Used to format the plain string returned as the base case of the recursive parser.
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
        postParseFormatter: function (parsed) {
            return '${' + parsed.valueName + '}';
        }
    },
    {
        type: 'select',
        regex: /^{\s*([A-Z_]+)\s*,\s*select\s*,\s*(.*)\s*}$/,
        parse: messageParser,
        tokenParser: pairedOptionsParser
    },
    {
        type: 'plural',
        regex: /^{\s*([A-Z_]+)\s*,\s*plural\s*,\s*(.*)\s*}$/,
        parse: messageParser,
        tokenParser: pairedOptionsParser,
        baseCaseFormatter: function (str) {
            return str.replace(/#/g, '${#}');
        }
    }
];

module.exports = function parse (str, baseCaseFormatter) {
    var tokens;

    // base case of plain string
    if (!containsFormatElement(str)) {
        return baseCaseFormatter ? baseCaseFormatter(str) : str;
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
                    parsed.options[key] = parse(value, formatter.baseCaseFormatter);
                });
            }

            return match;
        });
    });

    return tokens;
};
