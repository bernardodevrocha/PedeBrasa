"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChurrasqueiros = listChurrasqueiros;
exports.getChurrasqueiro = getChurrasqueiro;
exports.createChurrasqueiro = createChurrasqueiro;
const Churrasqueiro_1 = require("../models/Churrasqueiro");
async function listChurrasqueiros(_req, res) {
    const items = await Churrasqueiro_1.Churrasqueiro.findAll();
    return res.json(items);
}
async function getChurrasqueiro(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.findByPk(id);
    if (!item) {
        return res.status(404).json({ message: 'Churrasqueiro não encontrado' });
    }
    return res.json(item);
}
async function createChurrasqueiro(req, res) {
    const { name, city, description, pricePerHour } = req.body;
    if (!name || !city || typeof pricePerHour !== 'number') {
        return res.status(400).json({
            message: 'name, city e pricePerHour são obrigatórios',
        });
    }
    const item = await Churrasqueiro_1.Churrasqueiro.create({
        name,
        city,
        description: description ?? null,
        pricePerHour,
    });
    return res.status(201).json(item);
}
//# sourceMappingURL=churrasqueirosController.js.map