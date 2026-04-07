import type { Request, Response } from "express";
import { Op, type FindOptions } from "sequelize";
import { Churrasqueiro } from "../../models/churrasqueiros/Churrasqueiro";

export async function listChurrasqueiros(req: Request, res: Response) {
  const rawSearch =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  const options: FindOptions<Churrasqueiro> = {
    order: [
      ["name", "ASC"],
      ["id", "ASC"],
    ],
  };

  if (rawSearch) {
    options.where = {
      [Op.or]: [
        { name: { [Op.like]: `%${rawSearch}%` } },
        { city: { [Op.like]: `%${rawSearch}%` } },
      ],
    };
  }

  const items = await Churrasqueiro.findAll(options);
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
  const { name, city, description, pricePerHour, imgChurrasqueiro } =
    req.body as {
    name?: string;
    city?: string;
    description?: string;
    pricePerHour?: number;
    imgChurrasqueiro?: string;
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
    imgChurrasqueiro: imgChurrasqueiro ?? null,
    pricePerHour,
  });

  return res.status(201).json(item);
}

export async function updateChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const { name, city, description, pricePerHour, imgChurrasqueiro } =
    req.body as {
    name?: string;
    city?: string;
    description?: string | null;
    pricePerHour?: number;
    imgChurrasqueiro?: string | null;
  };

  const item = await Churrasqueiro.findByPk(id);
  if (!item) {
    return res.status(404).json({ message: "Churrasqueiro não encontrado" });
  }

  if (typeof name === "string") {
    item.name = name;
  }
  if (typeof city === "string") {
    item.city = city;
  }
  if (typeof description === "string" || description === null) {
    item.description = description;
  }
  if (typeof pricePerHour === "number") {
    item.pricePerHour = pricePerHour;
  }
  if (
    typeof imgChurrasqueiro === "string" ||
    imgChurrasqueiro === null
  ) {
    item.imgChurrasqueiro = imgChurrasqueiro;
  }

  await item.save();
  return res.json(item);
}

export async function deleteChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const item = await Churrasqueiro.findByPk(id);
  if (!item) {
    return res.status(404).json({ message: "Churrasqueiro não encontrado" });
  }

  await item.destroy();
  return res.status(204).send();
}

