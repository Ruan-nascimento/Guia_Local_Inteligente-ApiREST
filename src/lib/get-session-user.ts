import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export async function getSessionUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user ?? null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = await getSessionUser(req);

  if (!user) {
    return res.status(401).json({
      message: "Usuário não autenticado.",
    });
  }

  req.user = user;
  next();
}