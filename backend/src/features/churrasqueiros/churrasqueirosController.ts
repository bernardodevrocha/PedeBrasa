import type { Request, Response } from "express";
import { Churrasqueiro } from "../../models/churrasqueiros/Churrasqueiro";

export async function listChurrasqueiros(_req: Request, res: Response) {
  const items = await Churrasqueiro.findAll();
  return res.json(items);
}

export async function getChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const item = await Churrasqueiro.findByPk(id);
  if (!item) {
    return res.status(404).json({ message: "Churrasqueiro não encontrado" });
  }

  return res.json(item);
}

export async function createChurrasqueiro(req: Request, res: Response) {
  const { name, city, description, pricePerHour } = req.body as {
    name?: string;
    city?: string;
    description?: string;
    pricePerHour?: number;
  };

  if (!name || !city || typeof pricePerHour !== "number") {
    return res.status(400).json({
      message: "name, city e pricePerHour são obrigatórios",
    });
  }

  const item = await Churrasqueiro.create({
    name,
    city,
    description: description ?? null,
    pricePerHour,
  });

  return res.status(201).json(item);
}
