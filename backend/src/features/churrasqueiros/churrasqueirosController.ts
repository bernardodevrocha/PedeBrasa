import type { Request, Response } from "express";
import { Op, type FindOptions } from "sequelize";
import type { AuthenticatedRequest } from "../../middlewares/auth";
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

const LIST_CACHE_TTL_MS = 30_000;
const churrasqueirosListCache = new Map<
  string,
  { expiresAt: number; payload: unknown }
>();

function getCachedChurrasqueirosList(key: string) {
  const cached = churrasqueirosListCache.get(key);
  if (!cached || cached.expiresAt < Date.now()) {
    churrasqueirosListCache.delete(key);
    return null;
  }

  return cached.payload;
}

function setCachedChurrasqueirosList(key: string, payload: unknown) {
  churrasqueirosListCache.set(key, {
    expiresAt: Date.now() + LIST_CACHE_TTL_MS,
    payload,
  });

  if (churrasqueirosListCache.size > 50) {
    const [firstKey] = churrasqueirosListCache.keys();
    if (firstKey) {
      churrasqueirosListCache.delete(firstKey);
    }
  }
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
  const requestedPage = Number(req.query.page);
  const requestedPageSize = Number(req.query.pageSize);
  const hasPagination =
    Number.isInteger(requestedPage) || Number.isInteger(requestedPageSize);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, 50)
      : 10;
  const cacheKey = JSON.stringify({
    search: rawSearch.toLowerCase(),
    page: hasPagination ? page : null,
    pageSize: hasPagination ? pageSize : null,
  });
  const cached = getCachedChurrasqueirosList(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const options: FindOptions<Churrasqueiro> = {};

  if (rawSearch) {
    options.where = {
      [Op.or]: [
        { name: { [Op.like]: `%${rawSearch}%` } },
        { city: { [Op.like]: `%${rawSearch}%` } },
      ],
    };
  }

  const { rows, count } = hasPagination
    ? await Churrasqueiro.findAndCountAll({
        ...options,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
    : {
        rows: await Churrasqueiro.findAll(options),
        count: 0,
      };

  const serializedItems = rows.map((item) => ({
      ...serializeChurrasqueiro(item),
      slug: buildChurrasqueiroSlug(item),
    }));
  const payload = hasPagination
    ? {
        items: serializedItems,
        page,
        pageSize,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / pageSize)),
      }
    : serializedItems;

  setCachedChurrasqueirosList(cacheKey, payload);
  return res.json(payload);
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

  const items = await Churrasqueiro.findAll();

  const churrasqueiro = items.find(
    (item) => buildChurrasqueiroSlug(item) === rawSlug,
  );

  if (!churrasqueiro) {
    return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
  }

  const links = await ChurrasqueiroParceiro.findAll({
    where: { churrasqueiroId: churrasqueiro.id },
  });

  const partnerIds = links.map((link) => link.parceiroId);
  const parceiros = partnerIds.length
    ? await Parceiro.findAll({
        where: { id: { [Op.in]: partnerIds } },
      })
    : [];

  const unavailableDates: string[] = [];

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
  churrasqueirosListCache.clear();

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
  churrasqueirosListCache.clear();
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
  churrasqueirosListCache.clear();

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
  });

  if (!item) {
    return res.status(404).json({
      message: "Perfil de churrasqueiro nao encontrado",
    });
  }

  return res.json({
    ...serializeChurrasqueiro(item),
    slug: buildChurrasqueiroSlug(item),
  });
}
