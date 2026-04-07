import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  addRecommendation,
  createParceiro,
  deleteParceiro,
  getParceiro,
  listParceiros,
  listParceirosForChurrasqueiro,
  removeRecommendation,
  updateParceiro,
} from "./parceirosController";

export const parceirosRouter = Router();

parceirosRouter.get("/parceiros", asyncHandler(listParceiros));
parceirosRouter.get("/parceiros/:id", asyncHandler(getParceiro));
parceirosRouter.post(
  "/parceiros",
  authMiddleware,
  asyncHandler(createParceiro),
);
parceirosRouter.put(
  "/parceiros/:id",
  authMiddleware,
  requireAdmin,
  asyncHandler(updateParceiro),
);
parceirosRouter.delete(
  "/parceiros/:id",
  authMiddleware,
  requireAdmin,
  asyncHandler(deleteParceiro),
);

parceirosRouter.get(
  "/churrasqueiros/:id/parceiros",
  asyncHandler(listParceirosForChurrasqueiro),
);
parceirosRouter.post(
  "/parceiros/:id/recomendacoes",
  authMiddleware,
  asyncHandler(addRecommendation),
);
parceirosRouter.delete(
  "/parceiros/:id/recomendacoes/:churrasqueiroId",
  authMiddleware,
  requireAdmin,
  asyncHandler(removeRecommendation),
);
