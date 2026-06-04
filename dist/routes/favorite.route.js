import { Router } from "express";
import { requireAuth } from "../lib/get-session-user";
import { createFavoriteController, deleteFavoriteController, listFavoritesController, } from "../controllers/favorite.controller";
const routes = Router();
routes.use(requireAuth);
routes.get("/", listFavoritesController);
routes.post("/", createFavoriteController);
routes.delete("/:placeId", deleteFavoriteController);
export default routes;
