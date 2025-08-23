import type { Request, Response } from 'express';

export const pingpong = async (req: Request, res: Response) => {
  res.json({ message: 'pong' });
};
