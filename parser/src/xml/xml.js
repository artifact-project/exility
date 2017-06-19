"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skeletik_1 = require("skeletik");
var utils = require("../utils/utils");
// Shortcut codes
var QUOTE_CODE = utils.QUOTE_CODE; // "
var MINUS_CODE = utils.MINUS_CODE; // -
var CLOSE_BRACKET_CODE = utils.CLOSE_BRACKET_CODE; // ]
var slashes = 0;
var attrName;
var tokensChain = [];
// Shortcut methods
var add = utils.add;
var addTag = utils.addTag;
var addComment = utils.addComment;
var addCDATA = utils.addCDATA;
var fail = utils.fail;
var expressionMixin = utils.expressionMixin;
function setBooleanAttr(lex, bone) {
    addAttrValue(bone, lex.takeToken(), [true]);
}
function addAttrValue(bone, name, valueChain, token) {
    var list = bone.raw.attrs[name];
    if (list === void 0) {
        list = bone.raw.attrs[name] = [];
    }
    token && valueChain.push(token);
    if (valueChain.length) {
        list.push(valueChain.slice(0));
        valueChain.length = 0;
    }
}
function addText(parent, token) {
    if (tokensChain.length) {
        token && tokensChain.push(token);
        add(parent, utils.TEXT_TYPE, { value: tokensChain });
        tokensChain = [];
    }
    else if (token) {
        add(parent, utils.TEXT_TYPE, { value: token });
    }
}
var TO_TAG_NAME_STATE = '>tag:name';
// Export parser
exports.default = skeletik_1.default({
    '$ws': [' ', '	', '\n'],
    '$name': ['a-z', 'A-Z', '-', ':', '0-9'],
    '$name_start': ['a-z', 'A-Z', '_'],
    '$attr': ['a-z', 'A-Z', '-', '_', ':', '@', '0-9', '.']
}, {
    '': {
        '<': 'entry:open',
        '': '>text'
    },
    'entry:open': {
        '$': TO_TAG_NAME_STATE,
        '$name_start': TO_TAG_NAME_STATE,
        '/': 'tag:close',
        '!': 'comment-or-cdata',
        '': fail
    },
    'comment-or-cdata': {
        '-': 'comment:await',
        '[': 'cdata:await',
        '': 'text'
    },
    'comment:await': {
        '-': 'comment:value',
        '': 'text'
    },
    'comment:value': {
        '>': function (lex, parent) {
            if (lex.prevCode === MINUS_CODE && lex.peek(-2) === MINUS_CODE) {
                addComment(parent, lex.takeToken().slice(0, -2));
                return '';
            }
            else {
                return '->';
            }
        },
        '': '->'
    },
    'cdata:await': {
        '': function (lex) {
            var token = lex.getToken();
            if (token === 'CDATA[') {
                return '!cdata:value';
            }
            else if (token.length === 6) {
                return 'text';
            }
            return '->';
        }
    },
    'cdata:value': {
        '>': function (lex, parent) {
            if (lex.prevCode === CLOSE_BRACKET_CODE && lex.peek(-2) === CLOSE_BRACKET_CODE) {
                addCDATA(parent, lex.takeToken(0, -2));
                return '';
            }
            else {
                return '->';
            }
        }
    },
    'text': expressionMixin(function () { return tokensChain; }, {
        '<': function (lex, parent) {
            addText(parent, lex.takeToken());
            return 'entry:open';
        },
        '': '->'
    }),
    'tag:name': expressionMixin(function () { return tokensChain; }, {
        '$name': '->',
        '/': function (lex, parent) {
            addTag(parent, lex.takeToken(), tokensChain);
            return 'tag:end';
        },
        '>': function (lex, parent) { return [addTag(parent, lex.takeToken(), tokensChain), '']; },
        '$ws': function (lex, parent) { return [addTag(parent, lex.takeToken(), tokensChain), 'tag:attrs']; }
    }),
    'tag:close': {
        '$name': '->',
        '>': function (lex, bone) {
            var name = lex.takeToken();
            var mustName = bone.raw && bone.raw.name;
            if (mustName !== name) {
                lex.error('Wrong closing tag "' + name + '", must be "' + mustName + '"', bone);
            }
            return [bone.parent, ''];
        },
        '': fail
    },
    'tag:end': {
        '>': '',
        '': fail
    },
    'tag:attrs': {
        '$attr': '!tag:attr',
        '$ws': '->',
        '/': function (lex, bone) { return [bone.parent, 'tag:end']; },
        '>': '',
        '': fail
    },
    'tag:attr': {
        '$attr': '->',
        '$ws': function (lex, bone) {
            setBooleanAttr(lex, bone);
            return 'tag:attrs';
        },
        '/': function (lex, bone) {
            setBooleanAttr(lex, bone);
            return [bone.parent, 'tag:end'];
        },
        '=': function (lex) {
            attrName = lex.takeToken();
            return 'tag:attr:value:await';
        },
        '': fail
    },
    'tag:attr:value:await': {
        '"': function () {
            slashes = 0;
            return 'tag:attr:value:read';
        },
        '': fail
    },
    'tag:attr:value:read': expressionMixin(function () { return tokensChain; }, {
        '\\': function () {
            slashes++;
            return '->';
        },
        ' ': function (lex, bone) {
            if (attrName === 'class') {
                addAttrValue(bone, attrName, tokensChain, lex.takeToken().trim());
                return '-->';
            }
            else {
                return '->';
            }
        },
        '"': function (lex, bone) {
            if (lex.code === QUOTE_CODE) {
                if (!(slashes % 2)) {
                    addAttrValue(bone, attrName, tokensChain, lex.takeToken());
                    return 'tag:attrs';
                }
            }
            slashes = 0;
            return '->';
        },
        '': function () {
            slashes = 0;
            return '->';
        }
    })
}, {
    onend: function (lex, bone, rootBone) {
        if (lex.lastIdx < lex.length) {
            addText(bone, lex.getToken(0, -1));
        }
        if (bone !== rootBone && bone.type !== '#root') {
            lex.error('<' + bone.raw.name + '/> must be closed', bone);
        }
    }
});
