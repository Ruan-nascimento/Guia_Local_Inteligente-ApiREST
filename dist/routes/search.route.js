import { Router } from "express";
import { requireAuth } from "../lib/get-session-user";
import { searchController } from "../controllers/search.controller";
const routes = Router();
routes.use(requireAuth);
routes.get("/:cep", searchController);
export default routes;
