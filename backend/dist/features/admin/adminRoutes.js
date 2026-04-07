"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const adminController_1 = require("./adminController");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.get("/admin/menu", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(adminController_1.getAdminMenu));
//# sourceMappingURL=adminRoutes.js.map