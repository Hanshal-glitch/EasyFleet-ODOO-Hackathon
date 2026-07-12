import 'express-session';
import { User, Role } from '@transport-ops/shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Express.Session & {
        userId?: string;
      };
    }
  }
}