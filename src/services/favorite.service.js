import { prisma } from "../lib/prisma";
export async function createFavorite(data) {
    return prisma.favoritePlace.upsert({
        where: {
            userId_placeId: {
                userId: data.userId,
                placeId: data.placeId,
            },
        },
        update: {
            name: data.name,
            category: data.category,
            description: data.description,
            rating: data.rating,
            hours: data.hours,
            latitude: data.latitude,
            longitude: data.longitude,
        },
        create: data,
    });
}
export async function getFavorites(userId) {
    return prisma.favoritePlace.findMany({
        where: {
            userId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
export async function deleteFavorite(userId, placeId) {
    return prisma.favoritePlace.delete({
        where: {
            userId_placeId: {
                userId,
                placeId,
            },
        },
    });
}
