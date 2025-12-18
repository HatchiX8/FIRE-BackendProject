"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
var notFound = function (_req, res) {
    res.status(404).json({ message: 'Not Found' });
};
exports.notFound = notFound;
