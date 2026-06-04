import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
export async function getSessionUser(req) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return session?.user ?? null;
}
export async function requireAuth(req, res, next) {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({
            message: "Usuário não autenticado.",
        });
    }
    req.user = user;
    next();
}
