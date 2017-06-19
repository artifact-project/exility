"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skeletik_1 = require("skeletik");
// Tokens
exports.T_ROOT = '#root';
exports.T_ID = 'identifier';
exports.T_SIGN = 'sign';
exports.T_STRING = 'string';
exports.T_NUMBER = 'number';
exports.T_REGEXP = 'regexp';
exports.T_BRACE = 'brace'; // {}
exports.T_BRACKET = 'bracket'; // []
exports.T_PARENTHESIS = 'parenthesis'; // ()
// Character codes
var DOT_CODE = 46; // "."
var COLON_DOT = 58; // ":"
// Group by token
var IS_GROUP = {};
IS_GROUP[exports.T_BRACE] = exports.T_BRACE;
IS_GROUP[exports.T_BRACKET] = exports.T_BRACKET;
IS_GROUP[exports.T_PARENTHESIS] = exports.T_PARENTHESIS;
// Group by character
var CHR_TO_GROUP = {
    '{': exports.T_BRACE, '}': exports.T_BRACE,
    '[': exports.T_BRACKET, ']': exports.T_BRACKET,
    '(': exports.T_PARENTHESIS, ')': exports.T_PARENTHESIS
};
var _code;
var _slashes = 0;
function add(lex, parent, type, raw) {
    var last = parent.last;
    if (last !== void 0) {
        if (type === exports.T_STRING && last.type !== exports.T_SIGN) {
            lex.error('Unexpected string', parent);
        }
        else if ((last.type === exports.T_STRING || last.type === exports.T_BRACKET || last.type === exports.T_PARENTHESIS) && (type === exports.T_NUMBER || type === exports.T_ID)) {
            lex.error('Unexpected ' + type, parent);
        }
    }
    return parent.add(type, raw).last;
}
function validate(lex, root) {
    var last = root.last;
    var rootType = root.type;
    if (rootType === exports.T_REGEXP) {
        lex.error('Invalid regular expression: missing /');
    }
    else if (rootType !== exports.T_ROOT) {
        if (rootType === exports.T_STRING) {
            lex.error('Invalid or unexpected token', root);
        }
        else {
            lex.error('Unexpected end of input', root);
        }
    }
    else if (last) {
        if (last.type === exports.T_SIGN) {
            if ((last.raw === '+') ||
                (last.raw === '/') ||
                (last.raw === '-') ||
                (last.raw === '!') ||
                (last.raw === '~') ||
                (last.raw === '*' && last.prev)) {
                lex.error('Unexpected end of input', root);
            }
            else {
                lex.error('Unexpected token ' + last.raw, root);
            }
        }
    }
}
function openGroup(lex, bone) {
    return add(lex, bone, CHR_TO_GROUP[lex.takeChar()]);
}
function closeGroup(lex, bone) {
    var chr = lex.takeChar();
    var type = CHR_TO_GROUP[chr];
    var parent = bone.parent;
    if (type !== bone.type || bone.last && bone.last.type === exports.T_SIGN) {
        lex.error('Unexpected token ' + chr, bone);
    }
    if (chr === ')' && bone.type === type && (!bone.nodes.length && (!bone.prev || bone.prev.type !== exports.T_ID))) {
        // lex.error('Unexpected end of input', bone);
        lex.error('Unexpected token ' + chr, bone);
    }
    return parent;
}
function openString(lex, bone) {
    _code = lex.code;
    _slashes = 0;
    return [add(lex, bone, exports.T_STRING), 'string'];
}
function closeString(lex, bone) {
    if (lex.code === _code) {
        if (!(_slashes % 2)) {
            bone.raw = lex.takeToken(0, 1).slice(1, -1);
            return bone.parent;
        }
    }
    _slashes = 0;
    return '->';
}
function fail(lex, bone) {
    lex.error("Unexpected token " + lex.takeChar(), bone);
}
// Export parser
exports.default = skeletik_1.default({
    '$id': ['a-z', 'A-Z', '_', '$'],
    '$number': ['0-9'],
    '$sign': ['+', '*', '/', '%', '-', '!', '?', ':', '.', '&', '|', '^', '~', ',', '=', '>', '<']
}, {
    '': {
        '"': openString,
        "'": openString,
        '{': openGroup,
        '}': closeGroup,
        '[': openGroup,
        ']': closeGroup,
        '(': openGroup,
        ')': closeGroup,
        '\r': '-->',
        '\n': '-->',
        ' ': '-->',
        '\t': '-->',
        ';': '-->',
        '/': function (lex, bone) {
            if (bone.last && bone.last.type === exports.T_SIGN || !bone.last && (!bone.parent || IS_GROUP[bone.type])) {
                lex.takeChar();
                return [
                    add(lex, bone, exports.T_REGEXP, { source: '', flags: '' }),
                    'regexp'
                ];
            }
            else {
                bone.add(exports.T_SIGN, lex.takeChar());
            }
        },
        '$id': 'id',
        '$sign': function (lex, bone) {
            var chr = lex.takeChar();
            var last = bone.last;
            if (last) {
                var prev = last.raw;
                if (last.type === exports.T_SIGN) {
                    if ((chr === '=') && (prev === '<' || prev === '>' || prev === '=' || prev === '==') ||
                        (chr === '&') && (prev === '&') ||
                        (chr === '|') && (prev === '|')) {
                        last.raw += chr;
                        return;
                    }
                    lex.error("Unexpected token " + chr);
                }
                else if (lex.code === DOT_CODE && last.type === exports.T_NUMBER) {
                    last.isFloat && lex.error('Unexpected end of input');
                    last.isFloat = true;
                    last.raw += chr;
                }
                else {
                    add(lex, bone, exports.T_SIGN, chr);
                }
            }
            else {
                add(lex, bone, exports.T_SIGN, chr);
            }
        },
        '$number': '!number',
        '': function (lex, bone) { lex.error('Invalid or unexpected token', bone); }
    },
    'regexp': {
        '/': function (lex, bone) {
            bone.raw.source = lex.takeToken();
            return bone.parent;
        }
    },
    'id': {
        '$id': 'id',
        '': function (lex, bone) {
            add(lex, bone, exports.T_ID, lex.takeToken());
            return '>';
        }
    },
    'number': {
        '$number': '->',
        '': function (lex, bone) {
            var last = bone.last;
            var token = lex.takeToken();
            if (last && last.type === exports.T_NUMBER) {
                last.raw += token;
            }
            else if (last && last.type === exports.T_SIGN && last.raw === '.') {
                last.raw += token;
                last.type = exports.T_NUMBER;
                last.isFloat = true;
            }
            else {
                add(lex, bone, exports.T_NUMBER, token);
            }
            return '>';
        }
    },
    'string': {
        '\\': function () {
            _slashes++;
            return '->';
        },
        '"': closeString,
        "'": closeString,
        '': function () {
            _slashes = 0;
            return '->';
        }
    }
}, {
    onend: validate
});
