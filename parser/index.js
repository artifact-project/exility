"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var skeletik_1 = require("skeletik");
var xml_1 = require("./src/xml/xml");
exports.xml = xml_1.default;
var exility_1 = require("./src/exility/exility");
exports.exility = exility_1.default;
var expression_1 = require("./src/expression/expression");
exports.expression = expression_1.default;
var utils = require("./src/utils/utils");
exports.utils = utils;
// Default
exports.default = exility_1.default;
var XNode = (function (_super) {
    __extends(XNode, _super);
    function XNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return XNode;
}(skeletik_1.Bone));
exports.XNode = XNode;
