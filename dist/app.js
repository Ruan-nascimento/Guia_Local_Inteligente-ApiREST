import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import favoriteRoutes from "./routes/favorite.route.js";
import searchRoutes from "./routes/search.route.js";
import { auth } from "./lib/auth.js";
const app = express();
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL.replace(/\/$/, ""), process.env.FRONTEND_URL.replace(/\/$/, "") + "/"]
    : [];
app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.all(/\/api\/auth\/.*/, toNodeHandler(auth));
app.use(express.json());
// Rota de Health Check para monitoramento e deploy no Render
app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});
app.use("/api/favorites", favoriteRoutes);
app.use("/api/search", searchRoutes);
app.get("/api/me", async (req, res) => {
    const { fromNodeHeaders } = await import("better-auth/node");
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    return res.json(session);
});
export { app };
