import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createBlogPost,
  getMyBlogProfile,
  listBlogPosts,
  updateBlogPost,
} from "./blogController";

export const blogRouter = Router();

blogRouter.get("/blog/posts", authMiddleware, asyncHandler(listBlogPosts));
blogRouter.get("/blog/me", authMiddleware, asyncHandler(getMyBlogProfile));
blogRouter.post("/blog/posts", authMiddleware, asyncHandler(createBlogPost));
blogRouter.put("/blog/posts/:id", authMiddleware, asyncHandler(updateBlogPost));
