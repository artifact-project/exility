"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var expression_1 = require("../expression/expression");
// Types
exports.ROOT_TYPE = '#root';
exports.DTD_TYPE = 'dtd';
exports.TAG_TYPE = 'tag';
exports.TEXT_TYPE = 'text';
exports.COMMENT_TYPE = 'comment';
exports.KEYWORD_TYPE = 'keyword';
exports.HIDDEN_CLASS_TYPE = 'hidden:class';
exports.PSEUDO_ELEMENT_TYPE = 'pseudo';
exports.DEFINE_TYPE = 'define';
exports.CALL_TYPE = 'call';
exports.EXPRESSION_TYPE = 'expression';
exports.GROUP_TYPE = 'group';
exports.CDATA_TYPE = 'cdata';
exports.INHERIT_TYPE = 'inherit';
// Codes
exports.ENTER_CODE = 10; // "\n"
exports.SPACE_CODE = 32; // " "
exports.DOT_CODE = 46; // "."
exports.COLON_CODE = 58; // "."
exports.COMMA_CODE = 44; // ","
exports.PIPE_CODE = 124; // "|"
exports.SLASH_CODE = 47; // "/"
exports.DOLLAR_CODE = 36; // "$"
exports.BACKSLASH_CODE = 92; // "\"
exports.ASTERISK_CODE = 42; // "*"
exports.OPEN_BRACE_CODE = 123; // "{"
exports.CLOSE_BRACE_CODE = 125; // "}"
exports.OPEN_BRACKET_CODE = 91; // "["
exports.CLOSE_BRACKET_CODE = 93; // "]"
exports.OPEN_PARENTHESIS_CODE = 40; // "("
exports.CLOSE_PARENTHESIS_CODE = 41; // ")"
exports.HASHTAG_CODE = 35; // "#"
exports.EQUAL_CODE = 61; // "="
exports.LT_CODE = 60; // "<"
exports.GT_CODE = 62; // ">"
exports.PLUS_CODE = 43; // "+"
exports.MINUS_CODE = 45; // "-"
exports.QUOTE_CODE = 34; // `"`
function add(parent, type, raw) {
    return parent.add(type, raw).last;
}
exports.add = add;
function addComment(parent, value) {
    add(parent, exports.COMMENT_TYPE, { value: value.trim() });
}
exports.addComment = addComment;
function addTag(parent, name, tokens) {
    if (tokens && tokens.length) {
        name && tokens.push(name);
        name = tokens.slice(0);
        tokens.length = 0;
    }
    if (name.charCodeAt && name.charCodeAt(0) === exports.COLON_CODE) {
        return add(parent, exports.PSEUDO_ELEMENT_TYPE, {
            name: name.substr(1),
            type: 'normal',
            attrs: {}
        });
    }
    else {
        return add(parent, exports.TAG_TYPE, { name: name, attrs: {} });
    }
}
exports.addTag = addTag;
function addKeyword(parent, name) {
    return add(parent, exports.KEYWORD_TYPE, { name: name, attrs: {} });
}
exports.addKeyword = addKeyword;
function addCDATA(parent, value) {
    add(parent, exports.CDATA_TYPE, { value: value });
}
exports.addCDATA = addCDATA;
function fail(lex, bone, columnOffset) {
    lex.error("Invalid character `" + lex.getChar() + "`, state: " + lex.state, bone, columnOffset);
}
exports.fail = fail;
function parseJS(lex, stopper, initialOffset) {
    if (initialOffset === void 0) { initialOffset = 0; }
    var start = lex.idx + initialOffset;
    var offset = 0;
    // Валидируем выражение
    expression_1.default.capture(lex, {
        onpeek: function (lex, bone) {
            offset = lex.code === stopper ? 0 : 1;
            return !(bone.type === exports.ROOT_TYPE && (lex.code === stopper || lex.prevCode === stopper));
        }
    });
    return lex.input.substring(start, lex.idx - offset).trim();
}
exports.parseJS = parseJS;
function parseJSCallArgs(lex) {
    var args = [];
    var idx = lex.idx;
    expression_1.default.capture(lex, {
        onpeek: function (lex, bone) {
            var exit = (bone.type === exports.ROOT_TYPE && (lex.code === exports.CLOSE_PARENTHESIS_CODE));
            if ((idx < lex.idx) && (exit || bone.type === exports.ROOT_TYPE && lex.code === exports.COMMA_CODE)) {
                var token = lex.input.substring(idx, lex.idx).trim();
                token && args.push(token);
                idx = lex.idx + 1;
            }
            return !exit;
        }
    });
    return args;
}
exports.parseJSCallArgs = parseJSCallArgs;
function expressionMixin(getter, states, strict) {
    var mixStates = {};
    function parse(lex, bone, offset) {
        var state = lex.state;
        var token = lex.takeToken();
        var expr = parseJS(lex, exports.CLOSE_BRACE_CODE).slice(offset);
        var list = getter(bone);
        token && list.push(token);
        list.push({ type: exports.EXPRESSION_TYPE, raw: expr });
        return ">" + state;
    }
    // !strict && (mixStates['{'] = (lex:Lexer, bone) => {
    // 	if (lex.prevCode !== BACKSLASH_CODE && lex.prevCode !== DOLLAR_CODE) {
    // 		return parse(lex, bone, 1);
    // 	}
    //
    // 	return '-->';
    // });
    mixStates['$'] = function (lex, bone) {
        if (lex.prevCode !== exports.BACKSLASH_CODE && lex.peek(+1) === exports.OPEN_BRACE_CODE) {
            return parse(lex, bone, 2);
        }
        return '->';
    };
    for (var key in states) {
        mixStates[key] = states[key];
    }
    return mixStates;
}
exports.expressionMixin = expressionMixin;
