/*
 * Copyright 2013 Yahoo! Inc. All rights reserved.
 * Licensed under the BSD License.
 * http://yuilibrary.com/license/
 */

var tokenize = require('./tokenize');

/**
Gets the content of the format element by peeling off the outermost pair of
brackets.
@method getFormatElementContent
@param {String} formatElement Format element
@return {String} Contents of format element
**/
function getFormatElementContent (formatElement) {
    return formatElement.replace(/^{\s*/, '').replace(/\s*}$/, '');
}

/**
Checks if the pattern contains a format element.
@method containsFormatElement
@param {String} pattern Pattern
@return {Boolean} Whether or not the pattern contains a format element
**/
function containsFormatElement (pattern) {
    return pattern.indexOf('{') >= 0;
}

/**
Parses a list of tokens into paired options where the key is the option name
and the value is the pattern.
@method pairedOptionsParser
@param {Object} parsed Parsed object
@param {Array} tokens Remaining tokens that come after the value name and the
    format id
@return {Object} Parsed object with added options
**/
function pairedOptionsParser (parsed, tokens) {
    var hasDefault,
        value,
        name,
        l,
        i;

    parsed.options  = {};

    if (tokens.length % 2) {
        throw new Error('Options must come in pairs: ' + JSON.stringify(tokens));
    }

    for (i = 0, l = tokens.length; i < l; i += 2) {
        name  = tokens[i];
        value = tokens[i + 1];

        parsed.options[name] = value;

        hasDefault = hasDefault || name === 'other';
    }

    if (!hasDefault) {
        throw new Error('Options must include default "other" option: ' + JSON.stringify(tokens));
    }

    return parsed;
}

/**
Parses a format element. Format elements are surrounded by curly braces, and
contain at least a value name.
@method formatElementParser
@param {String} formatElement A format element
@param {Object} match The result of a String.match() that has at least the
    value name at index 1 and a subformat at index 2
@return {Object} Parsed object
**/
function formatElementParser (formatElement, match) {
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
        parse: formatElementParser,
        postParser: function (parsed) {
            return '${' + parsed.valueName + '}';
        }
    },
    {
        type: 'select',
        regex: /^{\s*([A-Z_]+)\s*,\s*select\s*,\s*(.*)\s*}$/,
        parse: formatElementParser,
        tokenParser: pairedOptionsParser
    },
    {
        type: 'plural',
        regex: /^{\s*([A-Z_]+)\s*,\s*plural\s*,\s*(.*)\s*}$/,
        parse: formatElementParser,
        tokenParser: pairedOptionsParser,
        outputFormatter: function (str) {
            return str.replace(/#/g, '${#}');
        }
    }
];

/**
Parses a pattern that may contain nested format elements.
@method parse
@param {String} pattern A pattern
@param {Function} outputFormatter An optional formatter for the string output
@return {Object|Array} Parsed output
**/
module.exports = function parse (pattern, outputFormatter) {
    var tokens;

    // base case (plain string)
    if (!containsFormatElement(pattern)) {
        // Final chance to format the string before the parser spits it out
        return outputFormatter ? outputFormatter(pattern) : pattern;
    }

    tokens = tokenize(pattern);
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
