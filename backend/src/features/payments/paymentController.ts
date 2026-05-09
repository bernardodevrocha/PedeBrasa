import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth";

export async function payBooking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  return res.status(410).json({
    message: "Metodo de pagamento online removido desta versao",
  });
}
