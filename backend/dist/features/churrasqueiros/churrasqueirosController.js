"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChurrasqueiros = listChurrasqueiros;
exports.getChurrasqueiro = getChurrasqueiro;
exports.getChurrasqueiroProfile = getChurrasqueiroProfile;
exports.createChurrasqueiro = createChurrasqueiro;
exports.updateChurrasqueiro = updateChurrasqueiro;
exports.deleteChurrasqueiro = deleteChurrasqueiro;
exports.getMyChurrasqueiro = getMyChurrasqueiro;
const sequelize_1 = require("sequelize");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
const User_1 = require("../../models/auth/User");
const ChurrasqueiroParceiro_1 = require("../../models/parceiros/ChurrasqueiroParceiro");
const Parceiro_1 = require("../../models/parceiros/Parceiro");
function serializeChurrasqueiro(item) {
    const { userId, ...rest } = item.get({ plain: true });
    return rest;
}
function slugifySegment(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function buildChurrasqueiroSlug(item) {
    return `${slugifySegment(item.name)}-${slugifySegment(item.city)}`;
}
const LIST_CACHE_TTL_MS = 30000;
const churrasqueirosListCache = new Map();
function getCachedChurrasqueirosList(key) {
    const cached = churrasqueirosListCache.get(key);
    if (!cached || cached.expiresAt < Date.now()) {
        churrasqueirosListCache.delete(key);
        return null;
    }
    return cached.payload;
}
function setCachedChurrasqueirosList(key, payload) {
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
async function promoteUserToChurrasqueiro(userId) {
    const user = await User_1.User.findByPk(userId);
    if (!user || user.role !== "user") {
        return;
    }
    user.role = "churrasqueiro";
    await user.save();
}
async function demoteUserToRegularIfNoProfile(userId) {
    if (!userId) {
        return;
    }
    const remainingProfile = await Churrasqueiro_1.Churrasqueiro.findOne({
        where: { userId },
    });
    if (remainingProfile) {
        return;
    }
    const user = await User_1.User.findByPk(userId);
    if (!user || user.role !== "churrasqueiro") {
        return;
    }
    user.role = "user";
    await user.save();
}
async function listChurrasqueiros(req, res) {
    const rawSearch = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const requestedPage = Number(req.query.page);
    const requestedPageSize = Number(req.query.pageSize);
    const hasPagination = Number.isInteger(requestedPage) || Number.isInteger(requestedPageSize);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = Number.isInteger(requestedPageSize) && requestedPageSize > 0
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
    const options = {};
    if (rawSearch) {
        options.where = {
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${rawSearch}%` } },
                { city: { [sequelize_1.Op.like]: `%${rawSearch}%` } },
            ],
        };
    }
    const { rows, count } = hasPagination
        ? await Churrasqueiro_1.Churrasqueiro.findAndCountAll({
            ...options,
            limit: pageSize,
            offset: (page - 1) * pageSize,
        })
        : {
            rows: await Churrasqueiro_1.Churrasqueiro.findAll(options),
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
async function getChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    return res.json(serializeChurrasqueiro(item));
}
async function getChurrasqueiroProfile(req, res) {
    const rawSlug = typeof req.params.slug === "string" ? req.params.slug.trim() : "";
    if (!rawSlug) {
        return res.status(400).json({ message: "Slug invalido" });
    }
    const items = await Churrasqueiro_1.Churrasqueiro.findAll();
    const churrasqueiro = items.find((item) => buildChurrasqueiroSlug(item) === rawSlug);
    if (!churrasqueiro) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    const links = await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.findAll({
        where: { churrasqueiroId: churrasqueiro.id },
    });
    const partnerIds = links.map((link) => link.parceiroId);
    const parceiros = partnerIds.length
        ? await Parceiro_1.Parceiro.findAll({
            where: { id: { [sequelize_1.Op.in]: partnerIds } },
        })
        : [];
    const unavailableDates = [];
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
async function createChurrasqueiro(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const { name, city, description, pricePerHour, imgChurrasqueiro } = req.body;
    if (!name || !city || typeof pricePerHour !== "number") {
        return res.status(400).json({
            message: "name, city e pricePerHour sao obrigatorios",
        });
    }
    const existing = await Churrasqueiro_1.Churrasqueiro.findOne({
        where: { userId: req.user.sub },
    });
    if (existing) {
        return res.status(409).json({
            message: "Voce ja possui um perfil de churrasqueiro",
        });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.create({
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
async function updateChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const { name, city, description, pricePerHour, imgChurrasqueiro } = req.body;
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
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
async function deleteChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    const ownerUserId = item.userId;
    await item.destroy();
    await demoteUserToRegularIfNoProfile(ownerUserId);
    churrasqueirosListCache.clear();
    return res.status(204).send();
}
async function getMyChurrasqueiro(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado" });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findOne({
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
//# sourceMappingURL=churrasqueirosController.js.map