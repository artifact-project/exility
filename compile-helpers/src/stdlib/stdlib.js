"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var R_HTML_ENTITES = /[&<>"]/;
var R_HTML_ENTITY_AMP = /&/g;
var R_HTML_ENTITY_LT = /</g;
var R_HTML_ENTITY_GT = />/g;
var R_HTML_ENTITY_QUOTE = /"/g;
function NOOP() { }
exports.default = {
    NIL: null,
    R_HTML_ENTITES: R_HTML_ENTITES,
    R_HTML_ENTITY_AMP: R_HTML_ENTITY_AMP,
    R_HTML_ENTITY_LT: R_HTML_ENTITY_LT,
    R_HTML_ENTITY_GT: R_HTML_ENTITY_GT,
    R_HTML_ENTITY_QUOTE: R_HTML_ENTITY_QUOTE,
    NOOP: NOOP,
    TO_STRING: function (value) {
        return value == null ? '' : value + '';
    },
    RETURN_EMPTY_STRING: function () {
        return '';
    },
    HTML_ENCODE: function (value) {
        if (value == null) {
            return '';
        }
        if (R_HTML_ENTITES.test(value)) {
            if (value.indexOf('&') !== -1) {
                value = value.replace(R_HTML_ENTITY_AMP, '&amp;');
            }
            if (value.indexOf('<') !== -1) {
                value = value.replace(R_HTML_ENTITY_LT, '&lt;');
            }
            if (value.indexOf('>') !== -1) {
                value = value.replace(R_HTML_ENTITY_GT, '&gt;');
            }
            if (value.indexOf('"') !== -1) {
                value = value.replace(R_HTML_ENTITY_QUOTE, '&quot;');
            }
            return value;
        }
        return value.toString();
    },
    EACH: function (data, callback) {
        if (data != null) {
            if (data.forEach) {
                var length_1 = data.length;
                for (var i = 0; i < length_1; i++) {
                    callback(data[i], i);
                }
            }
            else {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        callback(data[key], key);
                    }
                }
            }
        }
    },
    SLOT: function (parent, slots, __super__, name, fn) {
        if (slots && slots.hasOwnProperty(name)) {
            slots[name](parent, __super__);
        }
        else {
            fn();
        }
    },
    CLONE_OBJECT: function (target) {
        var cloned = {};
        if (target != null) {
            for (var key in target) {
                cloned[key] = target[key];
            }
        }
        return cloned;
    }
};
