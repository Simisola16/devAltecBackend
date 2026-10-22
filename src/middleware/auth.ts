import { Request, Response, NextFunction } from 'express';

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const secretKey = process.env.ADMIN_SECRET_KEY || 'devaltec_admin_secret_2026';
  
  // Check header, query param, or Bearer token
  const headerKey = req.headers['x-admin-key'] as string;
  const queryKey = req.query.key as string;
  const authHeader = req.headers.authorization;
  const bearerKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const providedKey = headerKey || queryKey || bearerKey;

  if (!providedKey || providedKey !== secretKey) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing admin key',
    });
    return;
  }

  next();
};
