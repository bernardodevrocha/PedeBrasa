import type { Request, Response } from "express";
import { Op, type FindOptions } from "sequelize";
import type { AuthenticatedRequest } from "../../middlewares/auth";
import { Booking } from "../../models/bookings/Booking";
import { Churrasqueiro } from "../../models/churrasqueiros/Churrasqueiro";
import { User } from "../../models/auth/User";
import { ChurrasqueiroParceiro } from "../../models/parceiros/ChurrasqueiroParceiro";
import { Parceiro } from "../../models/parceiros/Parceiro";

function serializeChurrasqueiro(item: Churrasqueiro) {
  const { userId, ...rest } = item.get({ plain: true });
  return rest;
}

function slugifySegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildChurrasqueiroSlug(item: Pick<Churrasqueiro, "name" | "city">) {
  return `${slugifySegment(item.name)}-${slugifySegment(item.city)}`;
}

async function promoteUserToChurrasqueiro(userId: number) {
  const user = await User.findByPk(userId);
  if (!user || user.role !== "user") {
    return;
  }

  user.role = "churrasqueiro";
  await user.save();
}

async function demoteUserToRegularIfNoProfile(userId: number | null) {
  if (!userId) {
    return;
  }

  const remainingProfile = await Churrasqueiro.findOne({
    where: { userId },
  });

  if (remainingProfile) {
    return;
  }

  const user = await User.findByPk(userId);
  if (!user || user.role !== "churrasqueiro") {
    return;
  }

  user.role = "user";
  await user.save();
}

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
  return res.json(
    items.map((item) => ({
      ...serializeChurrasqueiro(item),
      slug: buildChurrasqueiroSlug(item),
    })),
  );
}

export async function getChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID invalido" });
  }

  const item = await Churrasqueiro.findByPk(id);
  if (!item) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  return res.json(serializeChurrasqueiro(item));
}

export async function getChurrasqueiroProfile(req: Request, res: Response) {
  const rawSlug =
    typeof req.params.slug === "string" ? req.params.slug.trim() : "";

  if (!rawSlug) {
    return res.status(400).json({ message: "Slug invalido" });
  }

  const items = await Churrasqueiro.findAll({
    order: [
      ["name", "ASC"],
      ["id", "ASC"],
    ],
  });

  const churrasqueiro = items.find(
    (item) => buildChurrasqueiroSlug(item) === rawSlug,
  );

  if (!churrasqueiro) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  const [links, bookings] = await Promise.all([
    ChurrasqueiroParceiro.findAll({
      where: { churrasqueiroId: churrasqueiro.id },
      order: [["parceiroId", "ASC"]],
    }),
    Booking.findAll({
      where: {
        churrasqueiroId: churrasqueiro.id,
        status: { [Op.ne]: "cancelled" },
      },
      order: [["date", "ASC"]],
    }),
  ]);

  const partnerIds = links.map((link) => link.parceiroId);
  const parceiros = partnerIds.length
    ? await Parceiro.findAll({
        where: { id: { [Op.in]: partnerIds } },
        order: [
          ["name", "ASC"],
          ["id", "ASC"],
        ],
      })
    : [];

  const unavailableDates = Array.from(
    new Set(bookings.map((booking) => booking.date)),
  );

  return res.json({
    ...serializeChurrasqueiro(churrasqueiro),
    slug: buildChurrasqueiroSlug(churrasqueiro),
    knownAs: churrasqueiro.name,
    parceiros: parceiros.map((parceiro) => ({
      id: parceiro.id,
      name: parceiro.name,
      category: parceiro.category,
      city: parceiro.city,
      couponCode: parceiro.couponCode,
    })),
    unavailableDates,
  });
}

export async function createChurrasqueiro(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

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
      message: "name, city e pricePerHour sao obrigatorios",
    });
  }

  const existing = await Churrasqueiro.findOne({
    where: { userId: req.user.sub },
  });
  if (existing) {
    return res.status(409).json({
      message: "Voce ja possui um perfil de churrasqueiro",
    });
  }

  const item = await Churrasqueiro.create({
    userId: req.user.sub,
    name,
    city,
    description: description ?? null,
    imgChurrasqueiro: imgChurrasqueiro ?? null,
    pricePerHour,
  });

  await promoteUserToChurrasqueiro(req.user.sub);

  return res.status(201).json(serializeChurrasqueiro(item));
}

export async function updateChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID invalido" });
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
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
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
  if (typeof imgChurrasqueiro === "string" || imgChurrasqueiro === null) {
    item.imgChurrasqueiro = imgChurrasqueiro;
  }

  await item.save();
  return res.json(serializeChurrasqueiro(item));
}

export async function deleteChurrasqueiro(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID invalido" });
  }

  const item = await Churrasqueiro.findByPk(id);
  if (!item) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  const ownerUserId = item.userId;
  await item.destroy();
  await demoteUserToRegularIfNoProfile(ownerUserId);

  return res.status(204).send();
}

export async function getMyChurrasqueiro(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.user) {
    return res.status(401).json({ message: "Nao autenticado" });
  }

  const item = await Churrasqueiro.findOne({
    where: { userId: req.user.sub },
    order: [["id", "ASC"]],
  });

  if (!item) {
    return res.status(404).json({
      message: "Perfil de churrasqueiro nao encontrado",
    });
  }

  return res.json(serializeChurrasqueiro(item));
}
