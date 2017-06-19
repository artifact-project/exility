"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stringifyParsedValue_1 = require("../stringifyParsedValue/stringifyParsedValue");
function stringifyAttributeValue(name, values, escape, node) {
    var length = values.length;
    var glue = name === 'class' ? ' ' : '';
    var _a = stringifyParsedValue_1.default(values[0], escape, node), value = _a.value, computed = _a.computed;
    if (length > 1) {
        for (var i = 1; i < length; i++) {
            var next = stringifyParsedValue_1.default(values[i], escape, node);
            var nextValue = next.value;
            computed = computed || next.computed;
            if (stringifyParsedValue_1.R_QUOTE_END.test(value)) {
                // Добавляем вконец строки `glue`
                value = value.slice(0, -1) + glue +
                    (stringifyParsedValue_1.R_QUOTE_START.test(nextValue)
                        ? nextValue.slice(1) // следующее значение тоже строка, так что отрезаем кавычку
                        : "\" + " + nextValue // возвращаем кавычку
                    );
            }
            else if (stringifyParsedValue_1.R_QUOTE_START.test(nextValue)) {
                // Добавляем строку с `glue`
                value += " + \"" + glue + nextValue.slice(1);
            }
            else {
                value += (glue ? " + \"" + glue + "\" + " : ' + ') + nextValue;
            }
        }
    }
    return { value: value, computed: computed };
}
exports.default = stringifyAttributeValue;
