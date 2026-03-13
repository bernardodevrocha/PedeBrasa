"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviewsForChurrasqueiro = listReviewsForChurrasqueiro;
exports.createReview = createReview;
const Booking_1 = require("../models/Booking");
const Review_1 = require("../models/Review");
async function listReviewsForChurrasqueiro(req, res) {
    const churrasqueiroId = Number(req.params.id);
    if (Number.isNaN(churrasqueiroId)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const reviews = await Review_1.Review.findAll({
        where: { churrasqueiroId },
        order: [['createdAt', 'DESC']],
    });
    return res.json(reviews);
}
async function createReview(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    const churrasqueiroId = Number(req.params.id);
    if (Number.isNaN(churrasqueiroId)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || typeof rating !== 'number') {
        return res.status(400).json({ message: 'bookingId e rating são obrigatórios' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'rating deve estar entre 1 e 5' });
    }
    const booking = await Booking_1.Booking.findByPk(bookingId);
    if (!booking) {
        return res.status(404).json({ message: 'Agendamento não encontrado' });
    }
    if (booking.userId !== req.user.sub && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Você não pode avaliar este agendamento' });
    }
    if (booking.churrasqueiroId !== churrasqueiroId) {
        return res.status(400).json({ message: 'Agendamento não pertence a este churrasqueiro' });
    }
    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
        return res.status(400).json({ message: 'Só é possível avaliar após o evento' });
    }
    const existing = await Review_1.Review.findOne({
        where: { bookingId, userId: req.user.sub },
    });
    if (existing) {
        return res.status(400).json({ message: 'Você já avaliou este agendamento' });
    }
    const review = await Review_1.Review.create({
        bookingId,
        churrasqueiroId,
        userId: req.user.sub,
        rating,
        comment: comment ?? null,
    });
    return res.status(201).json(review);
}
//# sourceMappingURL=reviewController.js.map