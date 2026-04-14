"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.churrasqueirosRouter = void 0;
const express_1 = require("express");
const churrasqueirosController_1 = require("./churrasqueirosController");
const auth_1 = require("../../middlewares/auth");
const reviewController_1 = require("../reviews/reviewController");
const asyncHandler_1 = require("../../utils/asyncHandler");
exports.churrasqueirosRouter = (0, express_1.Router)();
exports.churrasqueirosRouter.get("/churrasqueiros", (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.listChurrasqueiros));
exports.churrasqueirosRouter.get("/churrasqueiros/me", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.getMyChurrasqueiro));
exports.churrasqueirosRouter.get("/churrasqueiros/perfil/:slug", (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.getChurrasqueiroProfile));
exports.churrasqueirosRouter.get("/churrasqueiros/:id", (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.getChurrasqueiro));
exports.churrasqueirosRouter.post("/churrasqueiros", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.createChurrasqueiro));
exports.churrasqueirosRouter.put("/churrasqueiros/:id", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.updateChurrasqueiro));
exports.churrasqueirosRouter.delete("/churrasqueiros/:id", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(churrasqueirosController_1.deleteChurrasqueiro));
exports.churrasqueirosRouter.get("/churrasqueiros/:id/reviews", (0, asyncHandler_1.asyncHandler)(reviewController_1.listReviewsForChurrasqueiro));
exports.churrasqueirosRouter.post("/churrasqueiros/:id/reviews", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(reviewController_1.createReview));
//# sourceMappingURL=churrasqueirosRoutes.js.map