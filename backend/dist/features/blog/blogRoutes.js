"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const blogController_1 = require("./blogController");
exports.blogRouter = (0, express_1.Router)();
exports.blogRouter.get("/blog/posts", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(blogController_1.listBlogPosts));
exports.blogRouter.get("/blog/me", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(blogController_1.getMyBlogProfile));
exports.blogRouter.post("/blog/posts", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(blogController_1.createBlogPost));
exports.blogRouter.put("/blog/posts/:id", auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(blogController_1.updateBlogPost));
//# sourceMappingURL=blogRoutes.js.map