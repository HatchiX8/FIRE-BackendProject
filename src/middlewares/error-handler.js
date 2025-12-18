"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var errorHandler = function (err, _req, res, _next) {
    var message = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ message: message });
};
exports.errorHandler = errorHandler;
