import type { Response } from 'express';
import { Op } from 'sequelize';
import { Booking } from '../models/Booking';
import { Churrasqueiro } from '../models/Churrasqueiro';
import type { AuthenticatedRequest } from '../middlewares/auth';

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  const { churrasqueiroId, date, startTime, endTime } = req.body as {
    churrasqueiroId?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
  };

  if (!churrasqueiroId || !date || !startTime || !endTime) {
    return res.status(400).json({
      message: 'churrasqueiroId, date, startTime e endTime são obrigatórios',
    });
  }

  const churrasqueiro = await Churrasqueiro.findByPk(churrasqueiroId);
  if (!churrasqueiro) {
    return res.status(404).json({ message: 'Churrasqueiro não encontrado' });
  }

  const bookingDate = new Date(date);
  if (Number.isNaN(bookingDate.getTime())) {
    return res.status(400).json({ message: 'Data inválida' });
  }

  const now = new Date();
  if (bookingDate < new Date(now.toDateString())) {
    return res.status(400).json({ message: 'Não é possível agendar no passado' });
  }

  const [startHour, startMinute] = startTime.split(':').map((value) => Number(value));
  const [endHour, endMinute] = endTime.split(':').map((value) => Number(value));

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return res.status(400).json({ message: 'Horário inválido' });
  }

  const startDateTime = new Date(bookingDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(bookingDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  if (endDateTime <= startDateTime) {
    return res
      .status(400)
      .json({ message: 'Horário final deve ser maior que o horário inicial' });
  }

  const durationInHours =
    (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

  const totalPrice = Number(churrasqueiro.pricePerHour) * durationInHours;

  const conflict = await Booking.findOne({
    where: {
      churrasqueiroId,
      date,
      status: { [Op.ne]: 'cancelled' },
    },
  });

  if (conflict) {
    return res.status(409).json({ message: 'Churrasqueiro já possui agendamento nesta data' });
  }

  const booking = await Booking.create({
    userId: req.user.sub,
    churrasqueiroId,
    date,
    startTime,
    endTime,
    totalPrice,
    status: 'pending',
  });

  return res.status(201).json(booking);
}

export async function listMyBookings(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  const bookings = await Booking.findAll({
    where: { userId: req.user.sub },
    order: [['date', 'DESC']],
  });

  return res.json(bookings);
}

export async function listAllBookingsAdmin(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Apenas admin' });
  }

  const bookings = await Booking.findAll({
    order: [['createdAt', 'DESC']],
  });

  return res.json(bookings);
}

