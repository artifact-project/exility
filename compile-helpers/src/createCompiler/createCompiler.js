"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("@exility/parser");
var block_1 = require("@exility/block");
var simpleJavaScriptBeautifier_1 = require("../simpleJavaScriptBeautifier/simpleJavaScriptBeautifier");
function serialize(value) {
    if (value instanceof Function || value instanceof RegExp) {
        return value.toString();
    }
    else if (value instanceof Object) {
        return JSON.stringify(value);
    }
    else {
        return value;
    }
}
function extractLib(input, libName, _a, pure) {
    var prefix = _a[0], lib = _a[1];
    var regexp = new RegExp("\\b" + prefix + "_([A-Z_]+)\\b", 'g');
    var methods = [];
    var code = '';
    var matches;
    while (matches = regexp.exec(input)) {
        var method = matches[1];
        !methods.includes(method) && methods.push(method);
    }
    if (methods.length) {
        code = "" + methods.map(function (name) { return "var " + prefix + "_" + name + " = " + prefix + "." + name + ";"; }).join('\n');
        if (pure) {
            var vars_1 = [];
            var exports_1 = methods.map(function (name) {
                if (!lib[name]) {
                    throw libName + "." + name + " \u2014 not found";
                }
                var source = serialize(lib[name]);
                var matches = source.match(/\b[A-Z_]+\b/g);
                if (matches) {
                    matches.forEach(function (name) {
                        var value = "var " + name + " = " + serialize(lib[name]) + ";";
                        !vars_1.includes(value) && vars_1.push(value);
                    });
                }
                return "this." + name + " = " + source + ";";
            }).join('\n');
            if (vars_1.length) {
                exports_1 = vars_1.join('\n') + "\n" + exports_1;
            }
            code = "var " + prefix + " = new (function () {\n" + exports_1 + "\n});\n\n" + code;
        }
        else {
            code = "var " + prefix + " = __DEPS__." + libName + ";\n" + code;
        }
    }
    return code;
}
function normalize(input) {
    if (input) {
        var initialIndent = input.match(/^\n+([ \t]+)/);
        if (initialIndent) {
            var regexp_1 = new RegExp("^" + initialIndent[1]);
            input = input.trim().split(/\n/).map(function (line) { return line.replace(regexp_1, ''); }).join('\n');
        }
    }
    return input;
}
function createCompiler(factory) {
    return function compilerConfigurator(options) {
        var compile = factory(options);
        return function compiler(input) {
            var frag = parser_1.default(normalize(input));
            var source = [];
            var artifact = compile(frag, options);
            var noDeps = true;
            artifact.before && source.push(artifact.before, '');
            source.push('return function compiledTemplate(__SCOPE__) {');
            if (options.scope && options.scope.length) {
                source.push('__SCOPE__ = __SCOPE__ || {};');
                options.scope
                    .filter(function (name) { return /^[_a-z]([0-9a-z_]*)$/i.test(name); })
                    .forEach(function (name) {
                    source.push("var " + name + " = __SCOPE__." + name + ";");
                });
                if (options.scope.indexOf('__this__') === -1 && /__this__/.test(artifact.code)) {
                    source.push('var __this__ = __SCOPE__;');
                }
                source.push('');
            }
            source.push(artifact.code);
            source.push('}');
            artifact.after && source.push(artifact.after);
            var code = source.join('\n');
            // Создаём фабрику шаблона
            if (artifact.deps) {
                Object.keys(artifact.deps).forEach(function (libName) {
                    var result = extractLib(code, libName, artifact.deps[libName], options.pure);
                    if (result) {
                        code = result + "\n" + code;
                        noDeps = false;
                    }
                });
            }
            code = "function templateFactory(" + (options.pure || noDeps ? '' : '__DEPS__') + ") {\n\"use strict\";\n" + code + "\n}";
            code = simpleJavaScriptBeautifier_1.default(code);
            try {
                return Function('__COMPILER__', "return (" + code + ")")({
                    deps: artifact.deps,
                    options: options,
                    blockify: block_1.default.classify,
                    configure: function (extra) { return compilerConfigurator(__assign({}, Object(options), Object(extra))); },
                });
            }
            catch (err) {
                return Function("return (" + simpleJavaScriptBeautifier_1.default("\n\t\t\t\t\tfunction templateCompileFailedFactory() {\n\t\t\t\t\t\treturn function templateCompileFailed() {\n\t\t\t\t\t\t\t/***********************************\n\t\t\t\t\t\t\t\t" + code + "\n\t\t\t\t\t\t\t************************************/\n\t\t\t\t\t\t\treturn new Error(" + JSON.stringify(err.stack || err.message) + ");\n\t\t\t\t\t\t};\n\t\t\t\t\t}\n\t\t\t\t") + ");");
            }
            // .bind({
            // 	fromString: (template, extraOptions) => this.fromString(template, {
            // 		...options,
            // 		...extraOptions
            // 	}),
            // });
        };
    };
}
exports.default = createCompiler;
