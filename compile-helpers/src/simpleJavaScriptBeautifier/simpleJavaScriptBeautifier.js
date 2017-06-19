"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tabs = '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t';
var R_IF_ELSE = /^}\s*(if|else)/;
var R_RETURN = /return.*?;$/;
var R_BLOCK_CLOSE = /^}[;,]?$/;
var R_BLOCK_OPEN = /(function(\s\w+)?|if|for|return(\sfunc.*?)?)\s*[\(\{]/;
var R_VAR_OPEN = /^var.+(\{|\(|,)$/;
var R_INVOKE_BLOCK_OPEN = /^[a-z_][a-z0-9_]*\([^)]*$/i;
var R_INVOKE_BLOCK_CLOSE = /^\}?\);?$/i;
var R_EMPTY_LINE = /^\s+$/;
function combine() {
    var rules = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        rules[_i] = arguments[_i];
    }
    return new RegExp(rules.map(function (rule) { return rule.source; }).join('|'));
}
var R_OPEN = combine(R_BLOCK_OPEN, R_INVOKE_BLOCK_OPEN, R_VAR_OPEN);
var R_CLOSE = combine(R_BLOCK_CLOSE, R_INVOKE_BLOCK_CLOSE);
function simpleJavaScriptBeautifier(source) {
    var indent = 0;
    return source
        .trim()
        .split('\n')
        .map(function (line) {
        line = line.trim();
        if (R_IF_ELSE.test(line)) {
            line = tabs.substr(0, indent - 1) + line;
        }
        else if (R_OPEN.test(line)) {
            line = tabs.substr(0, indent) + line;
            !R_RETURN.test(line) && indent++;
        }
        else {
            R_CLOSE.test(line) && indent--;
            line = tabs.substr(0, indent) + line;
        }
        return R_EMPTY_LINE.test(line) ? '' : line;
    })
        .join('\n')
        .replace(/\n{2,}/g, '\n\n')
        .replace(/\{\n+/g, '{\n')
        .replace(/\n+(\s+\})/g, '\n$1');
}
exports.default = simpleJavaScriptBeautifier;
