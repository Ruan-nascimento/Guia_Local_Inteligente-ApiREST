import { Router } from "express";
import { requireAuth } from "../lib/get-session-user.js";
import { searchController } from "../controllers/search.controller.js";

const routes = Router();

routes.use(requireAuth);

routes.get("/:cep", searchController);

export default routes;
