import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import favoriteRoutes from "./routes/favorite.route";
import searchRoutes from "./routes/search.route";
import { auth } from "./lib/auth";
const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
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
