import type { Request, Response } from 'express';
import { User } from '../models/User';
import { Churrasqueiro } from '../models/Churrasqueiro';

export async function getAdminMenu(_req: Request, res: Response) {
  const [userCount, churrasqueiroCount] = await Promise.all([
    User.count(),
    Churrasqueiro.count(),
  ]);

  return res.json({
    message: 'Admin menu',
    stats: {
      users: userCount,
      churrasqueiros: churrasqueiroCount,
    },
  });
}
