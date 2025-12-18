"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
var express_1 = __importDefault(require("express"));
var health_routes_1 = require("./modules/health/health.routes");
var not_found_1 = require("./middlewares/not-found");
var error_handler_1 = require("./middlewares/error-handler");
var createApp = function () {
    var app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/health', health_routes_1.healthRoutes);
    app.use(not_found_1.notFound);
    app.use(error_handler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
