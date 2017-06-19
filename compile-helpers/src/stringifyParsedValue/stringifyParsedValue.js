"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("@exility/parser");
var stringify = JSON.stringify;
var EXPRESSION_TYPE = parser_1.utils.EXPRESSION_TYPE, INHERIT_TYPE = parser_1.utils.INHERIT_TYPE, GROUP_TYPE = parser_1.utils.GROUP_TYPE;
exports.R_QUOTE_START = /^"/;
exports.R_QUOTE_END = /"$/;
function stringifyParsedValue(values, escape, node) {
    var value = null;
    var computed = false;
    if (node == null) {
        node = {};
    }
    if (values != null) {
        switch (values.type) {
            case GROUP_TYPE:
                value = "(" + values.test + " ? " + stringifyParsedValue(values.raw, escape, node).value + " : \"\")";
                computed = true;
                break;
            case INHERIT_TYPE:
                var selfMode = values.raw === 'self';
                var target = node;
                value = '"NULL_INHERIT_REF"';
                do {
                    !selfMode && (target = target.parent);
                    if (target && target.raw.attrs.class) {
                        var parentValue = stringifyParsedValue(target.raw.attrs.class[0], escape, target);
                        value = parentValue.value;
                        computed = computed || parentValue.computed;
                        break;
                    }
                    selfMode && (target = target.parent);
                } while (target);
                break;
            case EXPRESSION_TYPE:
                value = (escape ? escape : '') + ("(" + values.raw + ")");
                computed = true;
                break;
            default:
                if (values === true || typeof values === 'string') {
                    value = stringify(values);
                }
                else {
                    var length_1 = values.length;
                    var next = stringifyParsedValue(values[0], escape, node);
                    value = next.value;
                    computed = next.computed;
                    if (length_1 > 1) {
                        for (var i = 1; i < length_1; i++) {
                            next = stringifyParsedValue(values[i], escape, node);
                            computed = computed || next.computed;
                            if (exports.R_QUOTE_END.test(value) && exports.R_QUOTE_START.test(next.value)) {
                                value = value.slice(0, -1) + next.value.slice(1);
                            }
                            else {
                                value += " + " + next.value;
                            }
                        }
                    }
                }
                break;
        }
    }
    return {
        value: value,
        computed: computed,
    };
}
exports.default = stringifyParsedValue;
