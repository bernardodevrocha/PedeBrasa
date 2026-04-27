"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listParceiros = listParceiros;
exports.getParceiro = getParceiro;
exports.createParceiro = createParceiro;
exports.updateParceiro = updateParceiro;
exports.deleteParceiro = deleteParceiro;
exports.listParceirosForChurrasqueiro = listParceirosForChurrasqueiro;
exports.addRecommendation = addRecommendation;
exports.removeRecommendation = removeRecommendation;
const sequelize_1 = require("sequelize");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
const ChurrasqueiroParceiro_1 = require("../../models/parceiros/ChurrasqueiroParceiro");
const Parceiro_1 = require("../../models/parceiros/Parceiro");
function isDateOnly(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function isWithinValidity(value) {
    const today = new Date().toISOString().slice(0, 10);
    return value >= today;
}
const LIST_CACHE_TTL_MS = 30000;
const parceirosListCache = new Map();
function getCachedParceirosList(key) {
    const cached = parceirosListCache.get(key);
    if (!cached || cached.expiresAt < Date.now()) {
        parceirosListCache.delete(key);
        return null;
    }
    return cached.payload;
}
function setCachedParceirosList(key, payload) {
    parceirosListCache.set(key, {
        expiresAt: Date.now() + LIST_CACHE_TTL_MS,
        payload,
    });
    if (parceirosListCache.size > 50) {
        const [firstKey] = parceirosListCache.keys();
        if (firstKey) {
            parceirosListCache.delete(firstKey);
        }
    }
}
async function buildParceirosResponse(items) {
    if (items.length === 0) {
        return [];
    }
    const partnerIds = items.map((item) => item.id);
    const links = await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.findAll({
        where: { parceiroId: { [sequelize_1.Op.in]: partnerIds } },
    });
    const churrasqueiroIds = Array.from(new Set(links.map((link) => link.churrasqueiroId)));
    const churrasqueiros = churrasqueiroIds.length
        ? await Churrasqueiro_1.Churrasqueiro.findAll({
            where: { id: { [sequelize_1.Op.in]: churrasqueiroIds } },
        })
        : [];
    const churrasqueiroById = new Map(churrasqueiros.map((item) => [item.id, item]));
    const linksByParceiroId = new Map();
    links.forEach((link) => {
        const current = linksByParceiroId.get(link.parceiroId);
        if (current) {
            current.push(link.churrasqueiroId);
            return;
        }
        linksByParceiroId.set(link.parceiroId, [link.churrasqueiroId]);
    });
    return items.map((item) => {
        const recommendedChurrasqueiros = (linksByParceiroId.get(item.id) ?? [])
            .map((churrasqueiroId) => churrasqueiroById.get(churrasqueiroId))
            .filter((churrasqueiro) => Boolean(churrasqueiro))
            .map((churrasqueiro) => ({
            id: churrasqueiro.id,
            name: churrasqueiro.name,
            city: churrasqueiro.city,
            imgChurrasqueiro: churrasqueiro.imgChurrasqueiro,
        }));
        return {
            ...item.get({ plain: true }),
            recommendedChurrasqueiros,
        };
    });
}
async function syncRecommendations(parceiroId, recommendedChurrasqueiroIds) {
    if (!recommendedChurrasqueiroIds) {
        return;
    }
    const uniqueIds = Array.from(new Set(recommendedChurrasqueiroIds
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)));
    const churrasqueiros = uniqueIds.length
        ? await Churrasqueiro_1.Churrasqueiro.findAll({
            where: { id: { [sequelize_1.Op.in]: uniqueIds } },
        })
        : [];
    if (churrasqueiros.length !== uniqueIds.length) {
        throw new Error("Um ou mais churrasqueiros informados nao existem");
    }
    await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.destroy({ where: { parceiroId } });
    if (uniqueIds.length === 0) {
        return;
    }
    await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.bulkCreate(uniqueIds.map((churrasqueiroId) => ({
        parceiroId,
        churrasqueiroId,
    })));
}
function parsePayload(req) {
    return req.body;
}
async function listParceiros(req, res) {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const cacheKey = JSON.stringify({
        search: search.toLowerCase(),
        category: category.toLowerCase(),
        city: city.toLowerCase(),
    });
    const cached = getCachedParceirosList(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    const where = {};
    const andConditions = [];
    if (search) {
        andConditions.push({
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${search}%` } },
                { category: { [sequelize_1.Op.like]: `%${search}%` } },
                { city: { [sequelize_1.Op.like]: `%${search}%` } },
            ],
        });
    }
    if (category) {
        andConditions.push({
            category: { [sequelize_1.Op.like]: `%${category}%` },
        });
    }
    if (city) {
        andConditions.push({
            city: { [sequelize_1.Op.like]: `%${city}%` },
        });
    }
    if (andConditions.length > 0) {
        where[sequelize_1.Op.and] = andConditions;
    }
    const items = await Parceiro_1.Parceiro.findAll({
        where,
    });
    const payload = await buildParceirosResponse(items);
    setCachedParceirosList(cacheKey, payload);
    return res.json(payload);
}
async function getParceiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await Parceiro_1.Parceiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Parceiro nao encontrado" });
    }
    const [responseItem] = await buildParceirosResponse([item]);
    return res.json(responseItem);
}
async function createParceiro(req, res) {
    const payload = parsePayload(req);
    const { name, category, description, featuredProducts, location, city, phone, openingHours, couponCode, validUntil, recommendedChurrasqueiroIds, } = payload;
    if (!name ||
        !category ||
        !location ||
        !city ||
        !phone ||
        !openingHours ||
        !couponCode ||
        !validUntil) {
        return res.status(400).json({
            message: "name, category, location, city, phone, openingHours, couponCode e validUntil sao obrigatorios",
        });
    }
    if (!isDateOnly(validUntil)) {
        return res
            .status(400)
            .json({ message: "validUntil deve estar no formato YYYY-MM-DD" });
    }
    if (!isWithinValidity(validUntil)) {
        return res.status(400).json({
            message: "validUntil deve ser hoje ou uma data futura",
        });
    }
    const item = await Parceiro_1.Parceiro.create({
        name,
        category,
        description: description ?? null,
        featuredProducts: featuredProducts ?? null,
        location,
        city,
        phone,
        openingHours,
        couponCode,
        validUntil,
    });
    try {
        await syncRecommendations(item.id, recommendedChurrasqueiroIds);
    }
    catch (error) {
        await item.destroy();
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Falha ao vincular recomendacoes",
        });
    }
    parceirosListCache.clear();
    const [responseItem] = await buildParceirosResponse([item]);
    return res.status(201).json(responseItem);
}
async function updateParceiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await Parceiro_1.Parceiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Parceiro nao encontrado" });
    }
    const payload = parsePayload(req);
    if (typeof payload.name === "string" && payload.name.trim()) {
        item.name = payload.name.trim();
    }
    if (typeof payload.category === "string" && payload.category.trim()) {
        item.category = payload.category.trim();
    }
    if (typeof payload.description === "string" ||
        payload.description === null) {
        item.description = payload.description;
    }
    if (typeof payload.featuredProducts === "string" ||
        payload.featuredProducts === null) {
        item.featuredProducts = payload.featuredProducts;
    }
    if (typeof payload.location === "string" && payload.location.trim()) {
        item.location = payload.location.trim();
    }
    if (typeof payload.city === "string" && payload.city.trim()) {
        item.city = payload.city.trim();
    }
    if (typeof payload.phone === "string" && payload.phone.trim()) {
        item.phone = payload.phone.trim();
    }
    if (typeof payload.openingHours === "string" &&
        payload.openingHours.trim()) {
        item.openingHours = payload.openingHours.trim();
    }
    if (typeof payload.couponCode === "string" &&
        payload.couponCode.trim()) {
        item.couponCode = payload.couponCode.trim();
    }
    if (typeof payload.validUntil === "string") {
        if (!isDateOnly(payload.validUntil)) {
            return res
                .status(400)
                .json({ message: "validUntil deve estar no formato YYYY-MM-DD" });
        }
        if (!isWithinValidity(payload.validUntil)) {
            return res.status(400).json({
                message: "validUntil deve ser hoje ou uma data futura",
            });
        }
        item.validUntil = payload.validUntil;
    }
    await item.save();
    if (payload.recommendedChurrasqueiroIds) {
        try {
            await syncRecommendations(id, payload.recommendedChurrasqueiroIds);
        }
        catch (error) {
            return res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Falha ao atualizar recomendacoes",
            });
        }
    }
    parceirosListCache.clear();
    const [responseItem] = await buildParceirosResponse([item]);
    return res.json(responseItem);
}
async function deleteParceiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const item = await Parceiro_1.Parceiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Parceiro nao encontrado" });
    }
    await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.destroy({ where: { parceiroId: id } });
    await item.destroy();
    parceirosListCache.clear();
    return res.status(204).send();
}
async function listParceirosForChurrasqueiro(req, res) {
    const churrasqueiroId = Number(req.params.id);
    if (Number.isNaN(churrasqueiroId)) {
        return res.status(400).json({ message: "ID invalido" });
    }
    const churrasqueiro = await Churrasqueiro_1.Churrasqueiro.findByPk(churrasqueiroId);
    if (!churrasqueiro) {
        return res.status(404).json({ message: "Churrasqueiro nao encontrado" });
    }
    const links = await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.findAll({
        where: { churrasqueiroId },
    });
    const partnerIds = links.map((link) => link.parceiroId);
    const parceiros = partnerIds.length
        ? await Parceiro_1.Parceiro.findAll({
            where: { id: { [sequelize_1.Op.in]: partnerIds } },
        })
        : [];
    return res.json(await buildParceirosResponse(parceiros));
}
async function addRecommendation(req, res) {
    const parceiroId = Number(req.params.id);
    const churrasqueiroId = Number(req.body.churrasqueiroId);
    if (Number.isNaN(parceiroId) || Number.isNaN(churrasqueiroId)) {
        return res.status(400).json({ message: "IDs invalidos" });
    }
    const [parceiro, churrasqueiro] = await Promise.all([
        Parceiro_1.Parceiro.findByPk(parceiroId),
        Churrasqueiro_1.Churrasqueiro.findByPk(churrasqueiroId),
    ]);
    if (!parceiro || !churrasqueiro) {
        return res.status(404).json({
            message: "Parceiro ou churrasqueiro nao encontrado",
        });
    }
    await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.findOrCreate({
        where: {
            parceiroId,
            churrasqueiroId,
        },
        defaults: {
            parceiroId,
            churrasqueiroId,
        },
    });
    parceirosListCache.clear();
    const [responseItem] = await buildParceirosResponse([parceiro]);
    return res.status(201).json(responseItem);
}
async function removeRecommendation(req, res) {
    const parceiroId = Number(req.params.id);
    const churrasqueiroId = Number(req.params.churrasqueiroId);
    if (Number.isNaN(parceiroId) || Number.isNaN(churrasqueiroId)) {
        return res.status(400).json({ message: "IDs invalidos" });
    }
    await ChurrasqueiroParceiro_1.ChurrasqueiroParceiro.destroy({
        where: {
            parceiroId,
            churrasqueiroId,
        },
    });
    parceirosListCache.clear();
    return res.status(204).send();
}
//# sourceMappingURL=parceirosController.js.map