import { Request, Response, NextFunction, RequestHandler } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validationMiddleware<T>(type: any): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dtoObj = plainToInstance(type, req.body);
    validate(dtoObj, { skipMissingProperties: false, whitelist: true, forbidNonWhitelisted: true })
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors.map((error: ValidationError) => Object.values(error.constraints || {})).join(', ');
          res.status(400).json({ status: 'error', message });
        } else {
          req.body = dtoObj;
          next();
        }
      });
  };
}
