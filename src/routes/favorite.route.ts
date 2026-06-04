import { Router } from "express";
import { requireAuth } from "../lib/get-session-user.js";
import {
  createFavoriteController,
  deleteFavoriteController,
  listFavoritesController,
} from "../controllers/favorite.controller.js";

const routes = Router();

routes.use(requireAuth);

routes.get("/", listFavoritesController);
routes.post("/", createFavoriteController);
routes.delete("/:placeId", deleteFavoriteController);

export default routes