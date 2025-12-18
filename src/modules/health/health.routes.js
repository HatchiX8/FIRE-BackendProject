"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
var express_1 = require("express");
var health_controller_1 = require("./health.controller");
exports.healthRoutes = (0, express_1.Router)();
exports.healthRoutes.get('/', health_controller_1.getHealth);
