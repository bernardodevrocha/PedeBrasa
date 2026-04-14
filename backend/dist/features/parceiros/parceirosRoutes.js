"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parceirosRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const parceirosController_1 = require("./parceirosController");
exports.parceirosRouter = (0, express_1.Router)();
exports.parceirosRouter.get("/parceiros", (0, asyncHandler_1.asyncHandler)(parceirosController_1.listParceiros));
exports.parceirosRouter.get("/parceiros/:id", (0, asyncHandler_1.asyncHandler)(parceirosController_1.getParceiro));
exports.parceirosRouter.post("/parceiros", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(parceirosController_1.createParceiro));
exports.parceirosRouter.put("/parceiros/:id", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(parceirosController_1.updateParceiro));
exports.parceirosRouter.delete("/parceiros/:id", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(parceirosController_1.deleteParceiro));
exports.parceirosRouter.get("/churrasqueiros/:id/parceiros", (0, asyncHandler_1.asyncHandler)(parceirosController_1.listParceirosForChurrasqueiro));
exports.parceirosRouter.post("/parceiros/:id/recomendacoes", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(parceirosController_1.addRecommendation));
exports.parceirosRouter.delete("/parceiros/:id/recomendacoes/:churrasqueiroId", auth_1.authMiddleware, auth_1.requireAdmin, (0, asyncHandler_1.asyncHandler)(parceirosController_1.removeRecommendation));
//# sourceMappingURL=parceirosRoutes.js.map