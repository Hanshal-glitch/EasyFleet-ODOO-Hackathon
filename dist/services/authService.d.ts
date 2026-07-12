export declare class AuthService {
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hash: string): Promise<boolean>;
    static login(email: string, password: string): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        role: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    static getUserById(id: string): Promise<any>;
    static register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: string;
    }): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        role: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
//# sourceMappingURL=authService.d.ts.map