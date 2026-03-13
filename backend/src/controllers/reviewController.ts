import type { Response } from 'express';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import type { AuthenticatedRequest } from '../middlewares/auth';

export async function listReviewsForChurrasqueiro(req: AuthenticatedRequest, res: Response) {
  const churrasqueiroId = Number(req.params.id);
  if (Number.isNaN(churrasqueiroId)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  const reviews = await Review.findAll({
    where: { churrasqueiroId },
    order: [['createdAt', 'DESC']],
  });

  return res.json(reviews);
}

export async function createReview(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  const churrasqueiroId = Number(req.params.id);
  if (Number.isNaN(churrasqueiroId)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  const { bookingId, rating, comment } = req.body as {
    bookingId?: number;
    rating?: number;
    comment?: string;
  };

  if (!bookingId || typeof rating !== 'number') {
    return res.status(400).json({ message: 'bookingId e rating são obrigatórios' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating deve estar entre 1 e 5' });
  }

  const booking = await Booking.findByPk(bookingId);
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

  const existing = await Review.findOne({
    where: { bookingId, userId: req.user.sub },
  });
  if (existing) {
    return res.status(400).json({ message: 'Você já avaliou este agendamento' });
  }

  const review = await Review.create({
    bookingId,
    churrasqueiroId,
    userId: req.user.sub,
    rating,
    comment: comment ?? null,
  });

  return res.status(201).json(review);
}
