import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObj = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoObj);

    if (errors.length > 0) {
      const messages = errors.map((error: ValidationError) => {
        return error.constraints ? Object.values(error.constraints).join(', ') : 'Validation failed';
      });
      return res.status(400).json({ errors: messages });
    }

    req.body = dtoObj;
    next();
  };
}
