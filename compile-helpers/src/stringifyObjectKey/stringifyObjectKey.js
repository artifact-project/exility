"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var R_IS_OBJECT_KEY_NORMAL = /^[a-z0-9$_]+$/i;
function stringifyObjectKey(key) {
    return R_IS_OBJECT_KEY_NORMAL.test(key) ? key : "" + JSON.stringify(key);
}
exports.default = stringifyObjectKey;
