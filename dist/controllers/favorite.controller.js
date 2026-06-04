import { createFavorite, deleteFavorite, getFavorites, } from "../services/favorite.service";
export async function createFavoriteController(req, res) {
    try {
        const userId = String(req.user?.id);
        const { placeId, name, category } = req.body;
        if (!placeId || !name || !category) {
            return res.status(400).json({
                message: "Dados obrigatórios do local não enviados.",
            });
        }
        const favorite = await createFavorite({
            userId,
            placeId: String(placeId),
            name,
            category,
            description: req.body.description ?? null,
            rating: req.body.rating ?? null,
            hours: req.body.hours ?? null,
            latitude: req.body.latitude ?? null,
            longitude: req.body.longitude ?? null,
        });
        return res.status(201).json(favorite);
    }
    catch {
        return res.status(500).json({
            message: "Erro ao adicionar favorito.",
        });
    }
}
export async function listFavoritesController(req, res) {
    try {
        const userId = String(req.user?.id);
        const favorites = await getFavorites(userId);
        return res.json(favorites);
    }
    catch {
        return res.status(500).json({
            message: "Erro ao listar favoritos.",
        });
    }
}
export async function deleteFavoriteController(req, res) {
    try {
        const userId = String(req.user?.id);
        const { placeId } = req.params;
        await deleteFavorite(userId, placeId);
        return res.status(204).send();
    }
    catch {
        return res.status(500).json({
            message: "Erro ao remover favorito.",
        });
    }
}
