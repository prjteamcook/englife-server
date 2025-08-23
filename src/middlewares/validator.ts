import { HttpException } from '@/exceptions';
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export default (joiScheme: Schema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) throw new HttpException(400, '데이터가 넘어오지 않았습니다.');
    try {
      await joiScheme.validateAsync(req.body);
    } catch (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next();
  };
