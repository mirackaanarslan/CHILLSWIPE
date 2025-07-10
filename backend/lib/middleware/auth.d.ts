import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                isAdmin?: boolean;
            };
        }
    }
}
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
//# sourceMappingURL=auth.d.ts.map