"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skeletik_1 = require("skeletik");
var utils = require("../utils/utils");
var xml_1 = require("../xml/xml");
// Shortcut types
var ROOT_TYPE = utils.ROOT_TYPE;
var DTD_TYPE = utils.DTD_TYPE;
var TEXT_TYPE = utils.TEXT_TYPE;
var HIDDEN_CLASS_TYPE = utils.HIDDEN_CLASS_TYPE;
var DEFINE_TYPE = utils.DEFINE_TYPE;
var CALL_TYPE = utils.CALL_TYPE;
var EXPRESSION_TYPE = utils.EXPRESSION_TYPE;
var GROUP_TYPE = utils.GROUP_TYPE;
// Shortcut codes
var ENTER_CODE = utils.ENTER_CODE; // "\n"
var SPACE_CODE = utils.SPACE_CODE; // " "
var DOT_CODE = utils.DOT_CODE; // "."
var COMMA_CODE = utils.COMMA_CODE; // ","
var DOLLAR_CODE = utils.DOLLAR_CODE; // "$"
var PIPE_CODE = utils.PIPE_CODE; // "|"
var SLASH_CODE = utils.SLASH_CODE; // "/"
var BACKSLASH_CODE = utils.BACKSLASH_CODE; // "\"
var ASTERISK_CODE = utils.ASTERISK_CODE; // "*"
var OPEN_BRACE_CODE = utils.OPEN_BRACE_CODE; // "{"
var CLOSE_BRACE_CODE = utils.CLOSE_BRACE_CODE; // "}"
var OPEN_BRACKET_CODE = utils.OPEN_BRACKET_CODE; // "["
var CLOSE_BRACKET_CODE = utils.CLOSE_BRACKET_CODE; // "]"
var OPEN_PARENTHESIS_CODE = utils.OPEN_PARENTHESIS_CODE; // "("
var CLOSE_PARENTHESIS_CODE = utils.CLOSE_PARENTHESIS_CODE; // ")"
var HASHTAG_CODE = utils.HASHTAG_CODE; // "#"
var EQUAL_CODE = utils.EQUAL_CODE; // "="
var LT_CODE = utils.LT_CODE; // "<"
var GT_CODE = utils.GT_CODE; // ">"
var PLUS_CODE = utils.PLUS_CODE; // "+"
var COLON_CODE = utils.COLON_CODE; // ":"
var KEYWORDS = {};
var _keyword;
var CONTINUE = '->';
var REWIND = '-->';
var TO = '>';
var DTD = 'dtd';
var VAR_OR_TAG = 'var_or_tag';
var HIDDEN_CLASS = 'hidden_class';
var ENTRY = 'entry';
var ENTRY_WS_MODE = ENTRY + '_ws_mode';
var ENTRY_GROUP = ENTRY + '_group';
var ENTRY_STOPPER = ENTRY + '_stopper';
var ENTRY_STOPPER_AWAIT = ENTRY_STOPPER + '_await';
var PSEUDO_ELEMENT = 'pseudo';
var PSEUDO_ELEMENT_AWAIT = 'pseudo_await';
var COMMENT = 'comment';
var COMMENT_AWAIT = COMMENT + '_await';
var MULTI_COMMENT = 'multi_' + COMMENT;
var ID_OR_CLASS = 'id_or_class';
var INLINE_ATTR = 'inline_attr';
var INLINE_ATTR_AWAIT = INLINE_ATTR + '_await';
var INLINE_ATTR_NEXT = INLINE_ATTR + '_next';
var INLINE_ATTR_NEXT_WS = INLINE_ATTR_NEXT + '_ws';
var INLINE_ATTR_VALUE = INLINE_ATTR + '_value';
var INLINE_ATTR_VALUE_AWAIT = INLINE_ATTR_VALUE + '_await';
var INLINE_ATTR_VALUE_END = INLINE_ATTR_VALUE + '_end';
var TEXT = 'text';
var TEXT_AWAIT = TEXT + '_await';
var CLASS_ATTR = 'class_attr';
var CLASS_ATTR_INLINE = 'class_attr_inline';
var KEYWORD = 'KEYWORD';
var KEYWORD_END = KEYWORD + '_END';
var KW_TYPE = 'KW_TYPE';
var KW_TYPE_VAR = KW_TYPE + '_var';
var KW_TYPE_VAR_NEXT = KW_TYPE_VAR + '_next';
var KW_TYPE_JS = KW_TYPE + '_js';
var FN_CALL = 'fn-call';
var DEFINE = 'define';
var DEFINE_ARGS = 'define_args';
var TO_TEXT = TO + TEXT;
var TO_ENTRY = TO + ENTRY;
var TO_ENTRY_GROUP = TO + ENTRY_GROUP;
var TO_ENTRY_STOPPER = TO + ENTRY_STOPPER;
var TO_ENTRY_STOPPER_AWAIT = TO + ENTRY_STOPPER_AWAIT;
var TO_ENTRY_WS_MODE = TO + ENTRY_WS_MODE;
var TO_KW_TYPE_VAR_NEXT = TO + KW_TYPE_VAR_NEXT;
var TO_KEYWORD = TO + KEYWORD;
var TO_KEYWORD_END = TO + KEYWORD_END;
var ID_ATTR_NAME = 'id';
var CLASS_ATTR_NAME = 'class';
var STOPPER_TO_STATE = (_a = {},
    _a[ENTER_CODE] = {
        close: true
    },
    _a[SLASH_CODE] = {
        to: COMMENT_AWAIT,
        close: true,
    },
    _a[DOT_CODE] = function (token) { return (token === CLASS_ATTR_NAME) ? { add: false, to: CLASS_ATTR } : { to: ID_OR_CLASS }; },
    _a[HASHTAG_CODE] = ID_OR_CLASS,
    _a[PIPE_CODE] = TEXT_AWAIT,
    _a[OPEN_BRACKET_CODE] = INLINE_ATTR_AWAIT,
    _a[EQUAL_CODE] = DEFINE_TYPE,
    _a[OPEN_PARENTHESIS_CODE] = FN_CALL,
    _a[OPEN_BRACE_CODE] = TO_ENTRY_GROUP,
    _a[CLOSE_BRACE_CODE] = TO_ENTRY_GROUP,
    _a[GT_CODE] = TO_ENTRY_GROUP,
    _a[PLUS_CODE] = TO_ENTRY_GROUP,
    _a);
var DEFINE_TYPES = (_b = {},
    _b[OPEN_BRACE_CODE] = ['brace', CLOSE_BRACE_CODE],
    _b[OPEN_BRACKET_CODE] = ['bracket', CLOSE_BRACKET_CODE],
    _b[OPEN_PARENTHESIS_CODE] = ['parenthesis', CLOSE_PARENTHESIS_CODE],
    _b);
var nameStoppersWithSpace = ['|', '/', '(', '>', '+', '{', '}', '=', '\n'];
var nameStoppersWithoutSpace = ['.', '#', '['];
var TAB_INDENT = 'tab';
var SPACE_INDENT = 'space';
var shortAttrType;
var inlineAttrName;
var indentMode;
var indentSize = 0;
var prevIndent = 0;
var tagNameChain = [];
var attrValueChain = [];
var isSuper;
// Shortcut methods
var add = utils.add;
var addTag = utils.addTag;
var addComment = utils.addComment;
var addKeyword = utils.addKeyword;
var fail = utils.fail;
var parseJS = utils.parseJS;
var parseJSCallArgs = utils.parseJSCallArgs;
var expressionMixin = utils.expressionMixin;
function addToText(bone, token) {
    if (token) {
        var value = bone.raw.value;
        if (typeof value === 'string') {
            bone.raw.value += token;
        }
        else {
            value.push(token);
        }
    }
}
function addAttrValue(lex, bone, name, values) {
    var list = bone.raw.attrs[name];
    if (list === void 0) {
        list = bone.raw.attrs[name] = [];
    }
    // Именно новый массив, а не .legnth = 0 (!!!)
    attrValueChain = [];
    if (name === ID_ATTR_NAME && list.length) {
        lex.error('Duplicate attribute "id" is not allowed', bone);
    }
    list.push(values);
}
function takeInlineAttrName(lex, bone) {
    inlineAttrName = lex.takeToken();
    !inlineAttrName && lex.error('Empty attribute name', bone);
}
function setInlineAttr(lex, bone, values) {
    takeInlineAttrName(lex, bone);
    addAttrValue(lex, bone, inlineAttrName, values);
}
function closeEntry(bone, group, shorty) {
    if (group && !bone.group) {
        bone = closeEntry(bone);
    }
    bone = bone.parent;
    if (shorty && bone) {
        while (bone.shorty) {
            bone = bone.parent;
        }
    }
    return bone;
}
function markAsGroup(lex, bone) {
    bone.group = true;
    return '';
}
function closeGroup(lex, bone) {
    return closeEntry(bone, true);
}
function inheritEntryHandle(returns) {
    var retVal = { type: utils.INHERIT_TYPE, raw: this };
    if (returns !== true) {
        attrValueChain.push(retVal);
        retVal = REWIND;
    }
    return retVal;
}
function parseXML(lex, root) {
    xml_1.default.capture(lex, {
        onpeek: function (lex, bone) {
            return !(bone === root && (lex.prevCode === PIPE_CODE && lex.code === HASHTAG_CODE));
        }
    }, root);
}
// Create parser
exports.default = skeletik_1.default({
    '$stn': [' ', '\t', '\n'],
    '$id_or_class': ['.', '#'],
    '$name': ['a-z', 'A-Z', '-', '_', '0-9', '@'],
    '$name_stopper': nameStoppersWithoutSpace.concat(nameStoppersWithSpace),
    '$pe_name': ['a-z', 'A-Z', '-', '_', '0-9', '.'],
    '$pe_name_stopper': nameStoppersWithSpace.concat('['),
    '$name_stopper_after_space': nameStoppersWithSpace,
    '$attr': ['a-z', 'A-Z', '-', '_', ':', '@', '0-9'],
    '$var_name_start': ['_', 'a-z', 'A-Z'],
    '$var_name_next': ['_', 'a-z', 'A-Z', '0-9'],
    '$define_type': ['[', '{', '('],
    '$ws_mode': ['<', '>']
}, (_c = {
        '': {
            '$stn': CONTINUE,
            '!': DTD,
            '|': TEXT_AWAIT,
            '/': COMMENT_AWAIT,
            ':': PSEUDO_ELEMENT_AWAIT,
            '}': closeGroup,
            '$name': '!' + ENTRY,
            '$id_or_class': function (lex, parent) {
                if (lex.peek(+1) === PIPE_CODE) {
                    // HTML fragment
                    lex.skipNext(2);
                    parseXML(lex, parent);
                    // return 'RAW';
                }
                else {
                    shortAttrType = lex.code;
                    return [addTag(parent, 'div'), ID_OR_CLASS];
                }
            },
            '%': "!" + HIDDEN_CLASS,
            '$': VAR_OR_TAG,
            '': fail
        },
        'RAW': {
            // ' ': CONTINUE,
            // '+': (lex, bone) => bone.parent,
            // '\n': (lex, bone) => closeEntry(bone),
            '': fail,
        }
    },
    _c[DTD] = {
        '\n': function (lex, bone) {
            add(bone, DTD_TYPE, { value: lex.takeToken() });
        }
    },
    _c[VAR_OR_TAG] = {
        '{': function (lex, parent) {
            var expr = parseJS(lex, CLOSE_BRACE_CODE, 1);
            tagNameChain.push({ type: EXPRESSION_TYPE, raw: expr });
            return TO_ENTRY;
        },
        '': fail
    },
    _c[ENTRY] = expressionMixin(function () { return tagNameChain; }, {
        ' ': TO_ENTRY_STOPPER_AWAIT,
        '$name': CONTINUE,
        '$name_stopper': TO_ENTRY_STOPPER,
        '': fail
    }, true),
    _c[ENTRY_STOPPER_AWAIT] = {
        ' ': CONTINUE,
        '$name_stopper_after_space': TO_ENTRY_STOPPER,
        '': function (lex, parent) {
            var token = lex.takeToken().trim();
            return KEYWORDS[token] ? [addKeyword(parent, token), exports.keywords.start(token)] : fail(lex, parent);
        }
    },
    _c[PSEUDO_ELEMENT_AWAIT] = {
        ':': "!" + PSEUDO_ELEMENT,
        '': fail,
    },
    _c[PSEUDO_ELEMENT] = {
        ' ': TO_ENTRY_STOPPER_AWAIT,
        '$pe_name': CONTINUE,
        '$pe_name_stopper': TO_ENTRY_STOPPER,
        '': fail,
    },
    _c[ENTRY_STOPPER] = {
        '': function (lex, parent) {
            var code = lex.code;
            var token = lex.takeToken().trim();
            var state = STOPPER_TO_STATE[code];
            if (token === 'super') {
                isSuper = true;
                return ENTRY;
            }
            else if (isSuper) {
                isSuper = false;
                token = "super." + token;
            }
            switch (typeof state) {
                case 'string':
                    state = { to: state };
                    break;
                case 'function':
                    state = state(token);
                    break;
            }
            shortAttrType = code;
            if (KEYWORDS[token]) {
                return [addKeyword(parent, token), exports.keywords.start(token)];
            }
            else if (state.add !== false && (token || tagNameChain.length)) {
                parent = addTag(parent, token, tagNameChain);
            }
            (PIPE_CODE === code) && (parent.shorty = true);
            return [state.close ? closeEntry(parent, false, true) : parent, state.to || ''];
        }
    },
    _c[CLASS_ATTR_INLINE] = expressionMixin(function () { return attrValueChain; }, {
        '&': inheritEntryHandle.bind('self'),
        ']': function (lex, bone) {
            var token = lex.takeToken();
            token && attrValueChain.push(token);
            addAttrValue(lex, bone, CLASS_ATTR_NAME, attrValueChain);
            return INLINE_ATTR_NEXT;
        },
        '=': function (lex, bone) {
            var token = lex.takeToken();
            token && attrValueChain.push(token);
            addAttrValue(lex, bone, CLASS_ATTR_NAME, [{
                    type: GROUP_TYPE,
                    test: parseJS(lex, CLOSE_BRACE_CODE, 3),
                    raw: attrValueChain,
                }]);
            return ">" + INLINE_ATTR_VALUE_END;
        }
    }),
    _c[HIDDEN_CLASS] = {
        '$name_stopper': function (lex, bone) {
            bone = add(bone, HIDDEN_CLASS_TYPE, { attrs: {} });
            addAttrValue(lex, bone, CLASS_ATTR_NAME, [inheritEntryHandle.call('parent', true), lex.takeToken(1).trim()]);
            return [bone, SPACE_CODE === lex.code ? ENTRY_STOPPER_AWAIT : TO_ENTRY_GROUP];
        }
    },
    _c[ID_OR_CLASS] = expressionMixin(function () { return attrValueChain; }, {
        '&': inheritEntryHandle.bind('parent'),
        '$name_stopper': function (lex, bone) {
            var code = lex.code;
            var token = lex.takeToken().trim();
            token && attrValueChain.push(token);
            if (attrValueChain.length) {
                addAttrValue(lex, bone, shortAttrType === DOT_CODE ? CLASS_ATTR_NAME : ID_ATTR_NAME, attrValueChain);
            }
            else {
                fail(lex, bone, -1);
            }
            shortAttrType = code;
            (PIPE_CODE === code) && (bone.shorty = true);
            return (HASHTAG_CODE === code || DOT_CODE === code)
                ? REWIND
                : (SPACE_CODE === code ? ENTRY_STOPPER_AWAIT : TO_ENTRY_STOPPER);
        }
    }),
    _c[ENTRY_GROUP] = {
        '{': markAsGroup,
        '}': closeGroup,
        '>': function (lex, bone) {
            bone.shorty = true;
        },
        '+': function (lex, bone) { return bone.parent; },
        '|': function (lex, parent) {
            (PIPE_CODE === lex.code) && (parent.shorty = true);
            return TEXT_AWAIT;
        },
        '/': function (lex, bone) { return [closeEntry(bone), COMMENT_AWAIT]; },
        '\n': function (lex, bone) { return closeEntry(bone); },
        ' ': CONTINUE,
        '': fail // todo: покрыть тестом
    },
    _c[INLINE_ATTR_AWAIT] = {
        '$stn': CONTINUE,
        '$name': "!" + INLINE_ATTR,
        '$ws_mode': TO_ENTRY_WS_MODE,
        '': fail
    },
    _c[ENTRY_WS_MODE] = {
        '$ws_mode': function (lex, bone) {
            bone.raw[lex.takeChar() === '<' ? 'wsBefore' : 'wsAfter'] = true;
            return REWIND;
        },
        ']': INLINE_ATTR_NEXT,
        '': fail
    },
    _c[INLINE_ATTR] = {
        '.': function (lex) { return lex.getToken() === CLASS_ATTR_NAME ? CLASS_ATTR_INLINE : CONTINUE; },
        ']': function (lex, bone) {
            setInlineAttr(lex, bone, [true]);
            return INLINE_ATTR_NEXT;
        },
        '$stn': function (lex, bone) {
            setInlineAttr(lex, bone, [true]);
            return INLINE_ATTR_NEXT_WS;
        },
        '=': function (lex, bone) { return (takeInlineAttrName(lex, bone), INLINE_ATTR_VALUE_AWAIT); },
        '$ws': fail,
        '': CONTINUE
    },
    _c[INLINE_ATTR_NEXT_WS] = {
        '$stn': CONTINUE,
        '$name': '!' + INLINE_ATTR,
        ']': INLINE_ATTR_NEXT,
        '': fail
    },
    _c[INLINE_ATTR_VALUE_AWAIT] = {
        '"': INLINE_ATTR_VALUE,
        '$': function (lex, bone) {
            var expr = parseJS(lex, CLOSE_BRACE_CODE).slice(2);
            addAttrValue(lex, bone, inlineAttrName, [{ type: EXPRESSION_TYPE, raw: expr }]);
            return ">" + INLINE_ATTR_VALUE_END;
        },
        '': fail
    },
    _c[INLINE_ATTR_VALUE] = expressionMixin(function () { return attrValueChain; }, {
        '"': function (lex, bone) {
            if (lex.prevCode !== BACKSLASH_CODE) {
                var token = lex.takeToken();
                token && attrValueChain.push(token);
                addAttrValue(lex, bone, inlineAttrName, attrValueChain);
                return INLINE_ATTR_VALUE_END;
            }
            return CONTINUE;
        },
        '\n': fail,
        '': CONTINUE
    }),
    _c[INLINE_ATTR_VALUE_END] = {
        '$stn': INLINE_ATTR_NEXT_WS,
        ']': INLINE_ATTR_NEXT,
        '': fail
    },
    _c[INLINE_ATTR_NEXT] = {
        '[': INLINE_ATTR_AWAIT,
        ' ': ENTRY_STOPPER_AWAIT,
        '$name_stopper': TO_ENTRY_STOPPER,
        '': fail
    },
    _c[COMMENT_AWAIT] = {
        '*': MULTI_COMMENT,
        '/': COMMENT,
        '': fail
    },
    _c[COMMENT] = {
        '\n': function (lex, parent) {
            addComment(parent, lex.takeToken());
        }
    },
    _c[MULTI_COMMENT] = {
        '/': function (lex, parent) {
            if (lex.prevCode === ASTERISK_CODE) {
                addComment(parent, lex.takeToken(0, -1));
            }
            else {
                return CONTINUE;
            }
        }
    },
    _c[TEXT_AWAIT] = {
        ' ': CONTINUE,
        '': function (lex, parent) {
            var multiline = (lex.takeChar() === '>' && PIPE_CODE === lex.prevCode);
            if (multiline) {
                lex.lastIdx++;
                !parent.group && (parent.shorty = true);
            }
            return [add(parent, TEXT_TYPE, { multiline: multiline, value: '' }), TO_TEXT];
        },
    },
    _c[TEXT] = expressionMixin(function (bone) {
        var value = bone.raw.value;
        (typeof value === 'string') && (bone.raw.value = value = []);
        return value;
    }, {
        '|': function (lex, bone) {
            if (bone.raw.multiline && LT_CODE === lex.prevCode) {
                addToText(bone, lex.takeToken(0, -1));
                return ENTRY_GROUP;
            }
            else {
                return CONTINUE;
            }
        },
        '\n': function (lex, bone) {
            if (bone.raw.multiline) {
                return CONTINUE;
            }
            bone.shorty = true;
            addToText(bone, lex.takeToken());
            return closeEntry(bone, false, true);
        }
    }),
    _c[KEYWORD] = {
        '': function (lex, bone) { return _keyword.parse(lex, bone); }
    },
    _c[KEYWORD_END] = {
        ' ': CONTINUE,
        '>': function (lex, bone) {
            bone.shorty = true;
        },
        '{': markAsGroup,
        '\n': function (lex, bone) { return closeEntry(bone, false, true); },
        '': fail
    },
    _c[KW_TYPE_VAR] = {
        '$var_name_start': TO_KW_TYPE_VAR_NEXT,
        '': fail
    },
    _c[KW_TYPE_VAR_NEXT] = {
        '$var_name_next': CONTINUE,
        '': function (lex, bone) { return _keyword.attr(bone, lex.takeToken()); }
    },
    _c[KW_TYPE_JS] = {
        '': function (lex, bone) { return _keyword.attr(bone, parseJS(lex, _keyword.stopper)); },
    },
    _c[DEFINE] = {
        ' ': CONTINUE,
        '$define_type': function (lex, bone) {
            var type = DEFINE_TYPES[lex.code];
            var raw = bone.raw;
            bone.type = DEFINE_TYPE;
            raw.type = type[0];
            raw.attrs = [];
            raw.opened = lex.code;
            raw.closed = type[1];
            return DEFINE_ARGS;
        },
        '': fail,
    },
    _c[DEFINE_ARGS] = {
        '$name': CONTINUE,
        '': function (lex, bone) {
            var code = lex.code;
            var raw = bone.raw;
            if (COMMA_CODE === code || SPACE_CODE === code || raw.closed === code) {
                var token = lex.takeToken().trim();
                token && raw.attrs.push(token);
                return raw.closed === code ? ENTRY_GROUP : REWIND;
            }
            else {
                fail(lex, bone);
            }
        }
    },
    _c[FN_CALL] = {
        '': function (lex, bone) {
            bone.type = CALL_TYPE;
            bone.raw.args = parseJSCallArgs(lex);
            return ENTRY_STOPPER_AWAIT;
        }
    },
    _c), {
    onstart: function () {
        indentMode = void 0;
        prevIndent = 0;
    },
    onend: function (lex, bone, rootBone) {
        if (rootBone === void 0) { rootBone = null; }
        if (indentMode || bone.shorty) {
            while (bone.type !== ROOT_TYPE) {
                bone = bone.parent;
                while (bone.shorty) {
                    bone = bone.parent;
                }
            }
        }
        if (bone !== rootBone && bone.type !== ROOT_TYPE) {
            lex.error(bone.raw.name + ' not closing');
        }
        return bone;
    },
    onindent: function (lex, bone) {
        var code = lex.code;
        var isComment = (SLASH_CODE === code && SLASH_CODE === lex.peek(+1));
        // Мультилайн текст
        if (ENTER_CODE === code || lex.state === TEXT) {
            return;
        }
        if (lex.indent.tab && lex.indent.space) {
            lex.error('Mixed spaces and tabs');
        }
        var mode = lex.indent.tab ? TAB_INDENT : (lex.indent.space ? SPACE_INDENT : indentMode);
        if (indentMode === void 0) {
            indentMode = mode;
            indentSize = lex.indent[mode];
        }
        else if (mode !== indentMode) {
            lex.error('Expected indentation with ' + indentMode + ' character', bone, -1);
        }
        if (mode !== void 0) {
            var indent = lex.indent[mode] / indentSize;
            var delta = indent - prevIndent;
            if (isComment) {
                delta = +(delta > 0);
                prevIndent += delta;
            }
            else {
                if (indent !== (indent | 0) || (delta > 1)) {
                    lex.error('Expected indentation of ' +
                        indentSize * (indent | 0) +
                        ' ' +
                        mode +
                        ' characters but found ' +
                        lex.indent[mode] +
                        '.', bone, -1);
                }
                prevIndent = indent;
            }
            if (lex.state !== MULTI_COMMENT && lex.state !== INLINE_ATTR_NEXT_WS) {
                // todo: delta > 1
                if (delta === 1 && !bone.group) {
                    bone = bone.last;
                    if (bone) {
                        while (bone.shorty) {
                            bone = bone.last;
                        }
                    }
                }
                else if (delta < 0) {
                    if (bone.group) {
                        (delta < -1) && lex.error('Wrong indent'); // todo: нормальную ошибку
                    }
                    else {
                        while (delta++) {
                            bone = bone.parent;
                            while (bone.shorty) {
                                bone = bone.parent;
                            }
                            if (bone === void 0) {
                                lex.error('An error occurred while closing tags');
                            }
                        }
                    }
                }
                return bone;
            }
        }
    }
});
// Keywords
exports.keywords = (function () {
    var _attr;
    var _cursor;
    var _variant;
    var parse = skeletik_1.default({
        '$ws': [' ', '\t', '\n'],
        '$seq': ['a-z', 'A-Z'],
        '$name': ['a-z', 'A-Z', '-']
    }, {
        '': {
            '@': 'attr',
            '': function (lex, bone) {
                bone.raw.push(lex.code);
            },
        },
        'attr': {
            ':': function (lex, bone) {
                _attr = lex.takeToken();
                return 'attr:type';
            }
        },
        'attr:type': {
            '$name': CONTINUE,
            '': function (lex, bone) {
                bone.raw.push({ attr: _attr, type: lex.takeToken() });
                return TO;
            }
        }
    }, {
        onstart: function (lex, bone) {
            bone.raw = [];
        }
    });
    return {
        start: function (name) {
            _cursor = 0;
            _keyword = KEYWORDS[name];
            _variant = 0;
            return TO_KEYWORD;
        },
        add: function (name, details, options) {
            if (options === void 0) { options = {}; }
            var variants = [].concat(details).map(function (value) { return parse(value).raw.slice(0, -1); });
            var maxVariants = variants.length;
            KEYWORDS[name] = {
                stopper: options.stopper || CLOSE_PARENTHESIS_CODE,
                attr: function (bone, value) {
                    bone.raw.attrs[_attr] = value;
                    return TO_KEYWORD;
                },
                parse: function (lex, bone) {
                    var code = lex.code;
                    var seqCode = variants[_variant][_cursor];
                    var prevSeqCode = variants[_variant][_cursor - 1];
                    if ((!seqCode && code === OPEN_BRACE_CODE) ||
                        ((code === OPEN_BRACE_CODE || code === ENTER_CODE) && options.optional)) {
                        // Конец, либо необязательно
                        options.validate && options.validate(lex, bone);
                        return TO_KEYWORD_END;
                    }
                    else if (code === seqCode) {
                        _cursor++;
                    }
                    else if (seqCode === SPACE_CODE) {
                        _cursor++;
                        return TO_KEYWORD;
                    }
                    else if ((code === SPACE_CODE) && (prevSeqCode === SPACE_CODE)) {
                        // Продолжаем пропускать пробелы
                    }
                    else if ((code === SPACE_CODE) && !seqCode) {
                        _cursor++;
                    }
                    else {
                        if (maxVariants - _variant > 1) {
                            for (var i = _variant; i < maxVariants; i++) {
                                if (variants[i][_cursor] === code) {
                                    _variant = i;
                                    return this.parse(lex, bone);
                                }
                            }
                        }
                        if (!seqCode) {
                            options.validate && options.validate(lex, bone);
                            return TO_KEYWORD_END;
                        }
                        else if (seqCode.attr) {
                            _attr = seqCode.attr;
                            _cursor++;
                            return TO + KW_TYPE + '_' + seqCode.type;
                        }
                        else if (code === GT_CODE) {
                            return TO_KEYWORD_END;
                        }
                        else {
                            fail(lex, bone);
                        }
                    }
                    return REWIND;
                }
            };
        }
    };
})();
// Define base keywords
exports.keywords.add('if', ' ( @test:js )');
exports.keywords.add('else', ' if ( @test:js )', {
    optional: true,
    validate: function (lex, bone) {
        var raw = bone.prev ? bone.prev.raw : {};
        if (!(raw.name === 'if' || raw.name === 'else' && raw.attrs.test)) {
            lex.error('Unexpected token else', bone);
        }
    }
});
exports.keywords.add('for', [
    ' ( @as:var in @data:js )',
    ' ( @as:var in @data:js ) track by @id:var',
    ' ( [ @key:var , @as:var ] in @data:js )',
    ' ( [ @key:var , @as:var ] in @data:js ) track by @id:var'
]);
exports.keywords.add('fx', ' ( @name:js )');
exports.keywords.add('anim', ' ( @name:js )');
exports.keywords.add('import', ' @name:var from @from:js', {
    stopper: ENTER_CODE
});
var _a, _b, _c;
