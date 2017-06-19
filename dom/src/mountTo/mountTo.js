"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mountTo(target, block) {
    block['__view__'].mountTo(target);
}
exports.default = mountTo;
