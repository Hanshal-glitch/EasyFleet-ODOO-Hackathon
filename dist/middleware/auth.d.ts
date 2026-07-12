import { Request, Response, NextFunction } from 'express';
import { Role } from '@transport-ops/shared/enums';
type RoleValue = `${Role}`;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: RoleValue[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireOwnershipOrRole(getResourceUserId: (req: Request) => Promise<string>): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=auth.d.ts.map