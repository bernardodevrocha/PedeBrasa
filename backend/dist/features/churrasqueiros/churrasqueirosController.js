"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChurrasqueiros = listChurrasqueiros;
exports.getChurrasqueiro = getChurrasqueiro;
exports.createChurrasqueiro = createChurrasqueiro;
exports.updateChurrasqueiro = updateChurrasqueiro;
exports.deleteChurrasqueiro = deleteChurrasqueiro;
const sequelize_1 = require("sequelize");
const Churrasqueiro_1 = require("../../models/churrasqueiros/Churrasqueiro");
async function listChurrasqueiros(req, res) {
    const rawSearch = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = rawSearch
        ? {
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${rawSearch}%` } },
                { city: { [sequelize_1.Op.like]: `%${rawSearch}%` } },
            ],
        }
        : undefined;
    const items = await Churrasqueiro_1.Churrasqueiro.findAll({
        where,
        order: [
            ["name", "ASC"],
            ["id", "ASC"],
        ],
    });
    return res.json(items);
}
async function getChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Churrasqueiro não encontrado" });
    }
    return res.json(item);
}
async function createChurrasqueiro(req, res) {
    const { name, city, description, pricePerHour, imgChurrasqueiro } = req.body;
    if (!name || !city || typeof pricePerHour !== "number") {
        return res.status(400).json({
            message: "name, city e pricePerHour são obrigatórios",
        });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.create({
        name,
        city,
        description: description ?? null,
        imgChurrasqueiro: imgChurrasqueiro ?? null,
        pricePerHour,
    });
    return res.status(201).json(item);
}
async function updateChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    const { name, city, description, pricePerHour, imgChurrasqueiro } = req.body;
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
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
    if (typeof imgChurrasqueiro === "string" ||
        imgChurrasqueiro === null) {
        item.imgChurrasqueiro = imgChurrasqueiro;
    }
    await item.save();
    return res.json(item);
}
async function deleteChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: "Churrasqueiro não encontrado" });
    }
    await item.destroy();
    return res.status(204).send();
}
//# sourceMappingURL=churrasqueirosController.js.map