var tokenize = require('./tokenize');

function getFormatElementContent (formatElement) {
    return formatElement.replace(/^{\s*/, '').replace(/\s*}$/, '');
}

function containsFormatElement (str) {
    return str.indexOf('{') >= 0;
}

function pairedOptionsParser (parsed, tokens) {
    var value,
        name;

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
            valueName: match[1]
        },
        tokens = match[2] && tokenize(match[2], true);

    // If there are any additional tokens to parse, it should be done here
    if (this.tokenParser && tokens) {
        parsed = this.tokenParser(parsed, tokens);
    }

    // Any final modifications to the parsed output should be done here
    if (this.postParser) {
        parsed = this.postParser(parsed);
    }

    return parsed;
}

// `type` (required): The name of the message format type.
// `regex` (required): The regex used to check if this formatter can parse the message.
// `parse` (required): The main parse method which is given the full message.
// `tokenParser` (optional): Used to parse the remaining tokens of a message (what remains after the variable and the format type).
// `postParser` (optional): Used to format the output before returning from the main `parse` method.
// `outputFormatter` (optional): Used to format the fully parsed string returned from the base case of the recursive parser.
var FORMATTERS = [
    {
        type: 'string',
        regex: /^{\s*([A-Z_]+)\s*}$/,
        parse: messageParser,
        postParser: function (parsed) {
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
        outputFormatter: function (str) {
            return str.replace(/#/g, '${#}');
        }
    }
];

module.exports = function parse (str, outputFormatter) {
    var tokens;

    // base case (plain string)
    if (!containsFormatElement(str)) {
        // Final chance to format the string before the parser spits it out
        return outputFormatter ? outputFormatter(str) : str;
    }

    tokens = tokenize(str);
    tokens.forEach(function (token, index) {
        var parsed;

        // Parse the token if any of the formatters are capable of doing so
        FORMATTERS.some(function (messageFormat) {
            var match = token.match(messageFormat.regex);
            if (match) {
                parsed = messageFormat.parse(token, match);
                tokens[index] = parsed;

                // Recursively parse the option values
                Object.keys(parsed.options || {}).forEach(function (key) {
                    var value = parsed.options[key];
                    value = getFormatElementContent(value);
                    parsed.options[key] = parse(value, messageFormat.outputFormatter);
                });
            }

            return match;
        });
    });

    return tokens;
};
