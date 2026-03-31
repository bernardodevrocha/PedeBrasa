import { Router } from "express";
import {
  createChurrasqueiro,
  getChurrasqueiro,
  listChurrasqueiros,
  updateChurrasqueiro,
  deleteChurrasqueiro,
} from "./churrasqueirosController";
import { authMiddleware, requireAdmin } from "../../middlewares/auth";
import {
  createReview,
  listReviewsForChurrasqueiro,
} from "../reviews/reviewController";
import { asyncHandler } from "../../utils/asyncHandler";

export const churrasqueirosRouter = Router();

churrasqueirosRouter.get(
  "/churrasqueiros",
  asyncHandler(listChurrasqueiros),
);
churrasqueirosRouter.get(
  "/churrasqueiros/:id",
  asyncHandler(getChurrasqueiro),
);
churrasqueirosRouter.post(
  "/churrasqueiros",
  authMiddleware,
  asyncHandler(createChurrasqueiro),
);
churrasqueirosRouter.put(
  "/churrasqueiros/:id",
  authMiddleware,
  requireAdmin,
  asyncHandler(updateChurrasqueiro),
);
churrasqueirosRouter.delete(
  "/churrasqueiros/:id",
  authMiddleware,
  requireAdmin,
  asyncHandler(deleteChurrasqueiro),
);

churrasqueirosRouter.get(
  "/churrasqueiros/:id/reviews",
  asyncHandler(listReviewsForChurrasqueiro),
);
churrasqueirosRouter.post(
  "/churrasqueiros/:id/reviews",
  authMiddleware,
  asyncHandler(createReview),
);
