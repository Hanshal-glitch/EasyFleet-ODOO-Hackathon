import { z } from 'zod';
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const validateQuery: (schema: z.ZodObject<any>) => (req: any, res: any, next: any) => Promise<any>;
export declare const validateBody: (schema: z.ZodObject<any>) => (req: any, res: any, next: any) => Promise<any>;
export declare const validateParams: (schema: z.ZodObject<any>) => (req: any, res: any, next: any) => Promise<any>;
//# sourceMappingURL=commonSchemas.d.ts.map