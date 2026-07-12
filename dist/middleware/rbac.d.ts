import { Request, Response, NextFunction } from 'express';
import { Role } from '@transport-ops/shared/enums';
type RoleValue = `${Role}`;
export declare function requireRole(...allowedRoles: RoleValue[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function hasRole(userRole: RoleValue, requiredRoles: RoleValue[]): boolean;
export declare function hasPermission(userRole: RoleValue, permission: string): boolean;
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=rbac.d.ts.map