var libassert   = require('assert'),
    libfs       = require('fs'),
    libpath     = require('path'),
    modulepath  = libpath.join(process.cwd(), 'lib', 'yrb2json'),
    prespath    = libpath.join(process.cwd(), 'tests', 'fixtures', 'example.pres'),
    jsonpath    = libpath.join(process.cwd(), 'tests', 'fixtures', 'example.json');

describe('yrb2json', function () {

    it('output looks as expected', function () {
        var yrb2json    = require(modulepath),
            pres        = libfs.readFileSync(prespath, 'utf8').toString(),
            json        = libfs.readFileSync(jsonpath, 'utf8').toString();

        // remove formatting
        json = JSON.stringify(JSON.parse(json));

        libassert.equal(yrb2json(pres), json);
    });

    it('invalid inputs', function () {
        var yrb2json = require(modulepath),
            item,
            num_tests = 0,
            invalidInput = {
                "&": "Missing '=' in line &.",
                "=": "Empty key not allowed.",
                "= value": "Empty key not allowed.",
                "key = <<<": "Incomplete heredoc with id .",
                "key = value\\": "Illegal escape sequence: unaccompanied \\",
                "key = v\\u0061lue": "Illegal escape sequence: \\u",
                "key = value\\\"": "Illegal escape sequence: \\\"",
                "k\\#ey = value": "Backslash not allowed in key: k\\#ey",
                "key = <<< end\nend ": "Incomplete heredoc with id end.",
                "key = <<< end": "Incomplete heredoc with id end.",
                "key = <<< end\n": "Incomplete heredoc with id end.",
                "key = <<< end\nend; ": "Incomplete heredoc with id end."
            };
        for (item in invalidInput) {
            if (invalidInput.hasOwnProperty(item)) {
                try {
                    yrb2json(item);
                } catch (e) {
                    libassert.equal(e.message, invalidInput[item]);
                    num_tests++;
                }
            }
        }
        libassert.equal(num_tests, 12);
    });

});
